use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateSensorRequest {
    pub sensor_id: String,
    pub name: String,
    pub sensor_type: String,
    pub manufacturer: Option<String>,
    pub model: Option<String>,
    pub firmware_version: Option<String>,
    pub capabilities: Option<Vec<String>>,
    pub location: Option<serde_json::Value>,
    pub asset_id: Option<String>,
    pub configuration: Option<serde_json::Value>,
    pub alert_thresholds: Option<serde_json::Value>,
    pub sampling_interval: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Serialize)]
pub struct CreateSensorResponse {
    pub success: bool,
    pub data: Option<SensorData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct SensorData {
    pub id: String,
    pub sensor_id: String,
    pub name: String,
    pub sensor_type: String,
    pub status: String,
    pub last_reading: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn handle_create_sensor(
    req: CreateSensorRequest,
    user_id: String,
) -> Result<CreateSensorResponse, Box<dyn std::error::Error>> {
    // Validate required fields
    if req.sensor_id.trim().is_empty() {
        return Ok(CreateSensorResponse {
            success: false,
            data: None,
            error: Some("Sensor ID is required".to_string()),
        });
    }

    if req.name.trim().is_empty() {
        return Ok(CreateSensorResponse {
            success: false,
            data: None,
            error: Some("Sensor name is required".to_string()),
        });
    }

    // Validate sensor type
    if !is_valid_sensor_type(&req.sensor_type) {
        return Ok(CreateSensorResponse {
            success: false,
            data: None,
            error: Some("Invalid sensor type".to_string()),
        });
    }

    let client = create_supabase_client()?;

    // Check if sensor ID already exists
    let existing_sensor = client
        .from("iot_sensors")
        .select("id")
        .eq("sensor_id", &req.sensor_id)
        .eq("user_id", &user_id)
        .single()
        .execute()
        .await;

    if existing_sensor.is_ok() {
        return Ok(CreateSensorResponse {
            success: false,
            data: None,
            error: Some("Sensor ID already exists".to_string()),
        });
    }

    // Validate asset ID if provided
    if let Some(asset_id) = &req.asset_id {
        let asset_exists = client
            .from("assets")
            .select("id")
            .eq("id", asset_id)
            .eq("user_id", &user_id)
            .single()
            .execute()
            .await;

        if asset_exists.is_err() {
            return Ok(CreateSensorResponse {
                success: false,
                data: None,
                error: Some("Invalid asset ID".to_string()),
            });
        }
    }

    // Set default capabilities based on sensor type
    let capabilities = req.capabilities.unwrap_or_else(|| get_default_capabilities(&req.sensor_type));

    // Set default alert thresholds
    let alert_thresholds = req.alert_thresholds.unwrap_or_else(|| get_default_thresholds(&req.sensor_type));

    // Create sensor record
    let sensor_insert = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "sensor_id": req.sensor_id,
        "name": req.name,
        "sensor_type": req.sensor_type,
        "manufacturer": req.manufacturer,
        "model": req.model,
        "firmware_version": req.firmware_version,
        "capabilities": capabilities,
        "location": req.location,
        "asset_id": req.asset_id,
        "configuration": req.configuration.unwrap_or_else(|| serde_json::json!({})),
        "alert_thresholds": alert_thresholds,
        "sampling_interval": req.sampling_interval.unwrap_or(60), // Default 60 seconds
        "is_active": req.is_active.unwrap_or(true),
        "status": "online",
        "battery_level": null,
        "signal_strength": null,
        "last_reading": null,
        "last_heartbeat": chrono::Utc::now().to_rfc3339(),
        "user_id": user_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let result = client
        .from("iot_sensors")
        .insert(&sensor_insert)
        .select("id, sensor_id, name, sensor_type, status, last_reading, created_at, updated_at")
        .single()
        .execute()
        .await;

    match result {
        Ok(sensor_data) => {
            let sensor: SensorData = serde_json::from_value(sensor_data)?;
            
            // Initialize sensor metrics
            let _ = initialize_sensor_metrics(&client, &sensor.id).await;
            
            // Setup monitoring rules
            let _ = setup_sensor_monitoring(&client, &sensor.id, &alert_thresholds).await;

            // Generate API key for sensor
            let _ = generate_sensor_api_key(&client, &sensor.id).await;

            Ok(CreateSensorResponse {
                success: true,
                data: Some(sensor),
                error: None,
            })
        },
        Err(e) => Ok(CreateSensorResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create sensor: {}", e)),
        }),
    }
}

fn is_valid_sensor_type(sensor_type: &str) -> bool {
    let valid_types = [
        "temperature", "humidity", "pressure", "accelerometer", "gyroscope",
        "gps", "proximity", "light", "sound", "air_quality", "vibration",
        "magnetic", "motion", "door", "window", "smoke", "gas", "water",
        "multi_sensor", "environmental", "security", "industrial"
    ];
    valid_types.contains(&sensor_type.to_lowercase().as_str())
}

fn get_default_capabilities(sensor_type: &str) -> Vec<String> {
    match sensor_type.to_lowercase().as_str() {
        "temperature" => vec!["temperature".to_string()],
        "humidity" => vec!["humidity".to_string()],
        "pressure" => vec!["pressure".to_string()],
        "accelerometer" => vec!["acceleration_x".to_string(), "acceleration_y".to_string(), "acceleration_z".to_string()],
        "gyroscope" => vec!["angular_velocity_x".to_string(), "angular_velocity_y".to_string(), "angular_velocity_z".to_string()],
        "gps" => vec!["latitude".to_string(), "longitude".to_string(), "altitude".to_string(), "accuracy".to_string()],
        "environmental" => vec!["temperature".to_string(), "humidity".to_string(), "pressure".to_string(), "air_quality".to_string()],
        "multi_sensor" => vec!["temperature".to_string(), "humidity".to_string(), "light".to_string(), "motion".to_string()],
        _ => vec!["generic_reading".to_string()],
    }
}

fn get_default_thresholds(sensor_type: &str) -> serde_json::Value {
    match sensor_type.to_lowercase().as_str() {
        "temperature" => serde_json::json!({
            "temperature_min": -40.0,
            "temperature_max": 85.0,
            "temperature_critical_min": -50.0,
            "temperature_critical_max": 100.0
        }),
        "humidity" => serde_json::json!({
            "humidity_min": 0.0,
            "humidity_max": 100.0,
            "humidity_critical_max": 95.0
        }),
        "pressure" => serde_json::json!({
            "pressure_min": 300.0,
            "pressure_max": 1100.0
        }),
        "accelerometer" => serde_json::json!({
            "shock_threshold": 5.0,
            "vibration_threshold": 2.0
        }),
        "gps" => serde_json::json!({
            "accuracy_threshold": 10.0,
            "geofence_enabled": false
        }),
        "environmental" => serde_json::json!({
            "temperature_min": -20.0,
            "temperature_max": 60.0,
            "humidity_max": 80.0,
            "air_quality_threshold": 150
        }),
        _ => serde_json::json!({
            "generic_min": 0.0,
            "generic_max": 100.0
        }),
    }
}

async fn initialize_sensor_metrics(
    client: &supabase::Client,
    sensor_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let metrics = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "sensor_id": sensor_id,
        "total_readings": 0,
        "successful_readings": 0,
        "failed_readings": 0,
        "average_battery_level": null,
        "average_signal_strength": null,
        "uptime_percentage": 100.0,
        "last_reading_time": null,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("sensor_metrics")
        .insert(&metrics)
        .execute()
        .await;

    Ok(())
}

async fn setup_sensor_monitoring(
    client: &supabase::Client,
    sensor_id: &str,
    alert_thresholds: &serde_json::Value,
) -> Result<(), Box<dyn std::error::Error>> {
    let monitoring_rule = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "sensor_id": sensor_id,
        "rule_type": "threshold_monitoring",
        "thresholds": alert_thresholds,
        "alert_enabled": true,
        "notification_channels": ["email", "dashboard"],
        "is_active": true,
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("sensor_monitoring_rules")
        .insert(&monitoring_rule)
        .execute()
        .await;

    Ok(())
}

async fn generate_sensor_api_key(
    client: &supabase::Client,
    sensor_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let api_key = format!("sensor_{}_{}", sensor_id, Uuid::new_v4().to_string().replace("-", "")[..16].to_string());
    
    let api_key_record = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "sensor_id": sensor_id,
        "api_key": api_key,
        "key_type": "sensor_data",
        "permissions": ["write_readings", "update_status"],
        "is_active": true,
        "expires_at": null, // No expiration for sensor keys
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("sensor_api_keys")
        .insert(&api_key_record)
        .execute()
        .await;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
