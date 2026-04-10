use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct IngestSensorDataRequest {
    pub sensor_id: String,
    pub readings: serde_json::Value,
    pub timestamp: Option<String>,
    pub battery_level: Option<f64>,
    pub signal_strength: Option<f64>,
    pub location: Option<LocationData>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Deserialize, Serialize)]
pub struct LocationData {
    pub latitude: f64,
    pub longitude: f64,
    pub altitude: Option<f64>,
    pub accuracy: Option<f64>,
}

#[derive(Serialize)]
pub struct IngestSensorDataResponse {
    pub success: bool,
    pub data: Option<IngestResultData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct IngestResultData {
    pub reading_id: String,
    pub sensor_id: String,
    pub timestamp: String,
    pub alerts_triggered: Vec<AlertInfo>,
    pub processed: bool,
}

#[derive(Serialize)]
pub struct AlertInfo {
    pub alert_type: String,
    pub message: String,
    pub severity: String,
}

pub async fn handle_ingest_sensor_data(
    req: IngestSensorDataRequest,
    api_key: String,
) -> Result<IngestSensorDataResponse, Box<dyn std::error::Error>> {
    let client = create_supabase_client()?;

    // Validate API key and get sensor info
    let sensor_result = validate_sensor_api_key(&client, &api_key, &req.sensor_id).await;
    let sensor_data = match sensor_result {
        Ok(data) => data,
        Err(error) => return Ok(IngestSensorDataResponse {
            success: false,
            data: None,
            error: Some(error),
        }),
    };

    let sensor_id = sensor_data.get("id").and_then(|v| v.as_str()).unwrap_or("");
    let user_id = sensor_data.get("user_id").and_then(|v| v.as_str()).unwrap_or("");

    // Validate readings data
    if req.readings.is_null() {
        return Ok(IngestSensorDataResponse {
            success: false,
            data: None,
            error: Some("Readings data is required".to_string()),
        });
    }

    // Use provided timestamp or current time
    let timestamp = req.timestamp.unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    // Validate timestamp format
    if chrono::DateTime::parse_from_rfc3339(&timestamp).is_err() {
        return Ok(IngestSensorDataResponse {
            success: false,
            data: None,
            error: Some("Invalid timestamp format".to_string()),
        });
    }

    let reading_id = Uuid::new_v4().to_string();

    // Create sensor reading record
    let reading_insert = serde_json::json!({
        "id": reading_id,
        "sensor_id": sensor_id,
        "readings": req.readings,
        "timestamp": timestamp,
        "battery_level": req.battery_level,
        "signal_strength": req.signal_strength,
        "latitude": req.location.as_ref().map(|l| l.latitude),
        "longitude": req.location.as_ref().map(|l| l.longitude),
        "altitude": req.location.as_ref().and_then(|l| l.altitude),
        "accuracy": req.location.as_ref().and_then(|l| l.accuracy),
        "metadata": req.metadata.unwrap_or_else(|| serde_json::json!({})),
        "user_id": user_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    let insert_result = client
        .from("iot_sensor_readings")
        .insert(&reading_insert)
        .execute()
        .await;

    match insert_result {
        Ok(_) => {
            // Update sensor status
            let _ = update_sensor_status(&client, sensor_id, &req, &timestamp).await;

            // Check for alerts
            let alerts = check_sensor_alerts(&client, sensor_id, &req.readings, &sensor_data).await?;

            // Update sensor metrics
            let _ = update_sensor_metrics(&client, sensor_id, true).await;

            // Process data for analytics (async)
            let _ = process_sensor_analytics(&client, sensor_id, &req.readings, &timestamp).await;

            Ok(IngestSensorDataResponse {
                success: true,
                data: Some(IngestResultData {
                    reading_id,
                    sensor_id: req.sensor_id,
                    timestamp,
                    alerts_triggered: alerts,
                    processed: true,
                }),
                error: None,
            })
        },
        Err(e) => {
            // Update metrics for failed reading
            let _ = update_sensor_metrics(&client, sensor_id, false).await;

            Ok(IngestSensorDataResponse {
                success: false,
                data: None,
                error: Some(format!("Failed to store sensor reading: {}", e)),
            })
        }
    }
}

async fn validate_sensor_api_key(
    client: &supabase::Client,
    api_key: &str,
    sensor_id: &str,
) -> Result<serde_json::Value, String> {
    // Validate API key
    let key_result = client
        .from("sensor_api_keys")
        .select("sensor_id, permissions, is_active, expires_at")
        .eq("api_key", api_key)
        .eq("is_active", true)
        .single()
        .execute()
        .await;

    let key_data = match key_result {
        Ok(data) => data,
        Err(_) => return Err("Invalid or inactive API key".to_string()),
    };

    // Check if key is for the correct sensor
    let key_sensor_id = key_data.get("sensor_id").and_then(|v| v.as_str()).unwrap_or("");
    if key_sensor_id != sensor_id {
        return Err("API key not authorized for this sensor".to_string());
    }

    // Check expiration
    if let Some(expires_at) = key_data.get("expires_at").and_then(|v| v.as_str()) {
        if let Ok(expiry) = chrono::DateTime::parse_from_rfc3339(expires_at) {
            if expiry < chrono::Utc::now() {
                return Err("API key has expired".to_string());
            }
        }
    }

    // Get sensor data
    let sensor_result = client
        .from("iot_sensors")
        .select("id, user_id, name, sensor_type, configuration")
        .eq("id", sensor_id)
        .eq("is_active", true)
        .single()
        .execute()
        .await;

    match sensor_result {
        Ok(data) => Ok(data),
        Err(_) => Err("Sensor not found or inactive".to_string()),
    }
}

async fn update_sensor_status(
    client: &supabase::Client,
    sensor_id: &str,
    req: &IngestSensorDataRequest,
    timestamp: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let status_update = serde_json::json!({
        "last_reading_at": timestamp,
        "battery_level": req.battery_level,
        "signal_strength": req.signal_strength,
        "status": "online",
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    client
        .from("iot_sensors")
        .update(&status_update)
        .eq("id", sensor_id)
        .execute()
        .await?;

    Ok(())
}

async fn check_sensor_alerts(
    client: &supabase::Client,
    sensor_id: &str,
    readings: &serde_json::Value,
    sensor_data: &serde_json::Value,
) -> Result<Vec<AlertInfo>, Box<dyn std::error::Error>> {
    let mut alerts = Vec::new();

    // Get alert rules for this sensor
    let rules_result = client
        .from("sensor_alert_rules")
        .select("*")
        .eq("sensor_id", sensor_id)
        .eq("is_active", true)
        .execute()
        .await?;

    if let Some(rules) = rules_result.as_array() {
        for rule in rules {
            if let Some(condition) = rule.get("condition").and_then(|v| v.as_object()) {
                if evaluate_alert_condition(condition, readings) {
                    alerts.push(AlertInfo {
                        alert_type: rule.get("alert_type").and_then(|v| v.as_str()).unwrap_or("unknown").to_string(),
                        message: rule.get("message").and_then(|v| v.as_str()).unwrap_or("Alert triggered").to_string(),
                        severity: rule.get("severity").and_then(|v| v.as_str()).unwrap_or("medium").to_string(),
                    });

                    // Create alert record
                    let alert_record = serde_json::json!({
                        "id": Uuid::new_v4().to_string(),
                        "sensor_id": sensor_id,
                        "alert_type": rule.get("alert_type"),
                        "message": rule.get("message"),
                        "severity": rule.get("severity"),
                        "readings": readings,
                        "created_at": chrono::Utc::now().to_rfc3339(),
                    });

                    let _ = client
                        .from("sensor_alerts")
                        .insert(&alert_record)
                        .execute()
                        .await;
                }
            }
        }
    }

    Ok(alerts)
}

fn evaluate_alert_condition(condition: &serde_json::Map<String, serde_json::Value>, readings: &serde_json::Value) -> bool {
    // Simple condition evaluation - can be extended for complex rules
    if let (Some(field), Some(operator), Some(value)) = (
        condition.get("field").and_then(|v| v.as_str()),
        condition.get("operator").and_then(|v| v.as_str()),
        condition.get("value")
    ) {
        if let Some(reading_value) = readings.get(field) {
            match operator {
                "gt" => reading_value.as_f64().unwrap_or(0.0) > value.as_f64().unwrap_or(0.0),
                "lt" => reading_value.as_f64().unwrap_or(0.0) < value.as_f64().unwrap_or(0.0),
                "eq" => reading_value == value,
                "gte" => reading_value.as_f64().unwrap_or(0.0) >= value.as_f64().unwrap_or(0.0),
                "lte" => reading_value.as_f64().unwrap_or(0.0) <= value.as_f64().unwrap_or(0.0),
                _ => false,
            }
        } else {
            false
        }
    } else {
        false
    }
}

async fn update_sensor_metrics(
    client: &supabase::Client,
    sensor_id: &str,
    success: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let increment_field = if success { "successful_readings" } else { "failed_readings" };
    
    // Use RPC to increment counters atomically
    let _ = client
        .rpc("increment_sensor_metric", &serde_json::json!({
            "sensor_id": sensor_id,
            "metric_field": increment_field,
            "increment_by": 1
        }))
        .execute()
        .await;

    Ok(())
}

async fn process_sensor_analytics(
    client: &supabase::Client,
    sensor_id: &str,
    readings: &serde_json::Value,
    timestamp: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Process analytics data (aggregations, trends, etc.)
    let analytics_data = serde_json::json!({
        "sensor_id": sensor_id,
        "readings": readings,
        "timestamp": timestamp,
        "processed_at": chrono::Utc::now().to_rfc3339(),
    });

    // Queue for background processing
    let _ = client
        .from("sensor_analytics_queue")
        .insert(&analytics_data)
        .execute()
        .await;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    Ok(supabase::Client::new(url, key))
}
