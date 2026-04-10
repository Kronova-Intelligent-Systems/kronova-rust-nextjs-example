use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;

#[derive(Deserialize)]
pub struct TrackShippingRequest {
    pub include_sensor_data: Option<bool>,
    pub include_events: Option<bool>,
}

#[derive(Serialize)]
pub struct TrackShippingResponse {
    pub success: bool,
    pub data: Option<ShippingTrackingData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct ShippingTrackingData {
    pub id: String,
    pub tracking_number: String,
    pub carrier: String,
    pub status: String,
    pub current_location: Option<serde_json::Value>,
    pub estimated_delivery: Option<String>,
    pub actual_delivery: Option<String>,
    pub progress_percentage: f64,
    pub events: Option<Vec<TrackingEvent>>,
    pub sensor_data: Option<SensorTrackingData>,
    pub alerts: Option<Vec<ShippingAlert>>,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct TrackingEvent {
    pub id: String,
    pub event_type: String,
    pub description: String,
    pub location: Option<String>,
    pub timestamp: String,
}

#[derive(Serialize)]
pub struct SensorTrackingData {
    pub sensor_id: String,
    pub current_readings: serde_json::Value,
    pub location_history: Vec<LocationReading>,
    pub environmental_data: Vec<EnvironmentalReading>,
    pub alerts: Vec<SensorAlert>,
}

#[derive(Serialize)]
pub struct LocationReading {
    pub latitude: f64,
    pub longitude: f64,
    pub timestamp: String,
    pub accuracy: Option<f64>,
}

#[derive(Serialize)]
pub struct EnvironmentalReading {
    pub temperature: Option<f64>,
    pub humidity: Option<f64>,
    pub pressure: Option<f64>,
    pub shock: Option<f64>,
    pub timestamp: String,
}

#[derive(Serialize)]
pub struct SensorAlert {
    pub id: String,
    pub alert_type: String,
    pub message: String,
    pub severity: String,
    pub timestamp: String,
    pub resolved: bool,
}

#[derive(Serialize)]
pub struct ShippingAlert {
    pub id: String,
    pub alert_type: String,
    pub message: String,
    pub severity: String,
    pub timestamp: String,
    pub resolved: bool,
}

pub async fn handle_track_shipping(
    shipping_id: String,
    req: TrackShippingRequest,
    user_id: String,
) -> Result<TrackShippingResponse, Box<dyn std::error::Error>> {
    let client = create_supabase_client()?;

    // Get shipping record
    let shipping_result = client
        .from("shipping")
        .select("*")
        .eq("id", &shipping_id)
        .eq("user_id", &user_id)
        .single()
        .execute()
        .await;

    let shipping_data = match shipping_result {
        Ok(data) => data,
        Err(_) => return Ok(TrackShippingResponse {
            success: false,
            data: None,
            error: Some("Shipping record not found or access denied".to_string()),
        }),
    };

    let tracking_number = shipping_data.get("tracking_number").and_then(|v| v.as_str()).unwrap_or("");
    let carrier = shipping_data.get("carrier").and_then(|v| v.as_str()).unwrap_or("");
    let status = shipping_data.get("status").and_then(|v| v.as_str()).unwrap_or("unknown");
    let estimated_delivery = shipping_data.get("estimated_delivery").and_then(|v| v.as_str()).map(|s| s.to_string());
    let actual_delivery = shipping_data.get("actual_delivery").and_then(|v| v.as_str()).map(|s| s.to_string());
    let updated_at = shipping_data.get("updated_at").and_then(|v| v.as_str()).unwrap_or("").to_string();

    // Get current location from latest tracking event
    let current_location = get_current_location(&client, &shipping_id).await?;

    // Calculate progress percentage
    let progress_percentage = calculate_progress_percentage(&status, &shipping_data);

    // Get tracking events if requested
    let events = if req.include_events.unwrap_or(true) {
        Some(get_tracking_events(&client, &shipping_id).await?)
    } else {
        None
    };

    // Get sensor data if requested and available
    let sensor_data = if req.include_sensor_data.unwrap_or(false) {
        get_sensor_tracking_data(&client, &shipping_id).await?
    } else {
        None
    };

    // Get shipping alerts
    let alerts = get_shipping_alerts(&client, &shipping_id).await?;

    // Update tracking data from carrier if needed
    let _ = update_carrier_tracking(&client, &shipping_id, carrier, tracking_number).await;

    Ok(TrackShippingResponse {
        success: true,
        data: Some(ShippingTrackingData {
            id: shipping_id,
            tracking_number: tracking_number.to_string(),
            carrier: carrier.to_string(),
            status: status.to_string(),
            current_location,
            estimated_delivery,
            actual_delivery,
            progress_percentage,
            events,
            sensor_data,
            alerts,
            updated_at,
        }),
        error: None,
    })
}

async fn get_current_location(
    client: &supabase::Client,
    shipping_id: &str,
) -> Result<Option<serde_json::Value>, Box<dyn std::error::Error>> {
    let result = client
        .from("shipping_events")
        .select("location, metadata")
        .eq("shipping_id", shipping_id)
        .not("location", "is", "null")
        .order("timestamp.desc")
        .limit(1)
        .single()
        .execute()
        .await;

    match result {
        Ok(event_data) => {
            if let Some(location) = event_data.get("location") {
                Ok(Some(location.clone()))
            } else {
                Ok(None)
            }
        },
        Err(_) => Ok(None),
    }
}

fn calculate_progress_percentage(status: &str, shipping_data: &serde_json::Value) -> f64 {
    match status.to_lowercase().as_str() {
        "created" | "pending" => 0.0,
        "picked_up" | "in_transit_to_carrier" => 10.0,
        "at_carrier_facility" => 25.0,
        "in_transit" => 50.0,
        "out_for_delivery" => 90.0,
        "delivered" => 100.0,
        "exception" | "returned" => {
            // Check if it was previously delivered
            if shipping_data.get("actual_delivery").is_some() {
                100.0
            } else {
                75.0 // Assume it was mostly there
            }
        },
        _ => 25.0, // Default for unknown status
    }
}

async fn get_tracking_events(
    client: &supabase::Client,
    shipping_id: &str,
) -> Result<Vec<TrackingEvent>, Box<dyn std::error::Error>> {
    let result = client
        .from("shipping_events")
        .select("id, event_type, description, location, timestamp")
        .eq("shipping_id", shipping_id)
        .order("timestamp.desc")
        .execute()
        .await?;

    let events: Vec<TrackingEvent> = result
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|event| {
            Some(TrackingEvent {
                id: event.get("id")?.as_str()?.to_string(),
                event_type: event.get("event_type")?.as_str()?.to_string(),
                description: event.get("description")?.as_str()?.to_string(),
                location: event.get("location").and_then(|v| v.as_str()).map(|s| s.to_string()),
                timestamp: event.get("timestamp")?.as_str()?.to_string(),
            })
        })
        .collect();

    Ok(events)
}

async fn get_sensor_tracking_data(
    client: &supabase::Client,
    shipping_id: &str,
) -> Result<Option<SensorTrackingData>, Box<dyn std::error::Error>> {
    // Get sensor link
    let sensor_link_result = client
        .from("shipping_sensor_links")
        .select("sensor_id")
        .eq("shipping_id", shipping_id)
        .eq("monitoring_active", true)
        .single()
        .execute()
        .await;

    let sensor_id = match sensor_link_result {
        Ok(link_data) => link_data.get("sensor_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        Err(_) => return Ok(None),
    };

    if sensor_id.is_empty() {
        return Ok(None);
    }

    // Get current sensor readings
    let current_readings_result = client
        .from("iot_sensor_readings")
        .select("*")
        .eq("sensor_id", &sensor_id)
        .order("timestamp.desc")
        .limit(1)
        .single()
        .execute()
        .await;

    let current_readings = current_readings_result.unwrap_or_else(|_| serde_json::json!({}));

    // Get location history
    let location_history = get_location_history(&client, &sensor_id).await?;

    // Get environmental data
    let environmental_data = get_environmental_data(&client, &sensor_id).await?;

    // Get sensor alerts
    let sensor_alerts = get_sensor_alerts(&client, &sensor_id).await?;

    Ok(Some(SensorTrackingData {
        sensor_id,
        current_readings,
        location_history,
        environmental_data,
        alerts: sensor_alerts,
    }))
}

async fn get_location_history(
    client: &supabase::Client,
    sensor_id: &str,
) -> Result<Vec<LocationReading>, Box<dyn std::error::Error>> {
    let result = client
        .from("iot_sensor_readings")
        .select("latitude, longitude, timestamp, accuracy")
        .eq("sensor_id", sensor_id)
        .not("latitude", "is", "null")
        .not("longitude", "is", "null")
        .order("timestamp.desc")
        .limit(50)
        .execute()
        .await?;

    let locations: Vec<LocationReading> = result
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|reading| {
            Some(LocationReading {
                latitude: reading.get("latitude")?.as_f64()?,
                longitude: reading.get("longitude")?.as_f64()?,
                timestamp: reading.get("timestamp")?.as_str()?.to_string(),
                accuracy: reading.get("accuracy").and_then(|v| v.as_f64()),
            })
        })
        .collect();

    Ok(locations)
}

async fn get_environmental_data(
    client: &supabase::Client,
    sensor_id: &str,
) -> Result<Vec<EnvironmentalReading>, Box<dyn std::error::Error>> {
    let result = client
        .from("iot_sensor_readings")
        .select("temperature, humidity, pressure, shock, timestamp")
        .eq("sensor_id", sensor_id)
        .order("timestamp.desc")
        .limit(100)
        .execute()
        .await?;

    let readings: Vec<EnvironmentalReading> = result
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|reading| {
            Some(EnvironmentalReading {
                temperature: reading.get("temperature").and_then(|v| v.as_f64()),
                humidity: reading.get("humidity").and_then(|v| v.as_f64()),
                pressure: reading.get("pressure").and_then(|v| v.as_f64()),
                shock: reading.get("shock").and_then(|v| v.as_f64()),
                timestamp: reading.get("timestamp")?.as_str()?.to_string(),
            })
        })
        .collect();

    Ok(readings)
}

async fn get_sensor_alerts(
    client: &supabase::Client,
    sensor_id: &str,
) -> Result<Vec<SensorAlert>, Box<dyn std::error::Error>> {
    let result = client
        .from("sensor_alerts")
        .select("id, alert_type, message, severity, timestamp, resolved")
        .eq("sensor_id", sensor_id)
        .order("timestamp.desc")
        .limit(20)
        .execute()
        .await?;

    let alerts: Vec<SensorAlert> = result
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|alert| {
            Some(SensorAlert {
                id: alert.get("id")?.as_str()?.to_string(),
                alert_type: alert.get("alert_type")?.as_str()?.to_string(),
                message: alert.get("message")?.as_str()?.to_string(),
                severity: alert.get("severity")?.as_str()?.to_string(),
                timestamp: alert.get("timestamp")?.as_str()?.to_string(),
                resolved: alert.get("resolved")?.as_bool().unwrap_or(false),
            })
        })
        .collect();

    Ok(alerts)
}

async fn get_shipping_alerts(
    client: &supabase::Client,
    shipping_id: &str,
) -> Result<Option<Vec<ShippingAlert>>, Box<dyn std::error::Error>> {
    let result = client
        .from("shipping_alerts")
        .select("id, alert_type, message, severity, timestamp, resolved")
        .eq("shipping_id", shipping_id)
        .order("timestamp.desc")
        .limit(10)
        .execute()
        .await;

    match result {
        Ok(alerts_data) => {
            let alerts: Vec<ShippingAlert> = alerts_data
                .as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|alert| {
                    Some(ShippingAlert {
                        id: alert.get("id")?.as_str()?.to_string(),
                        alert_type: alert.get("alert_type")?.as_str()?.to_string(),
                        message: alert.get("message")?.as_str()?.to_string(),
                        severity: alert.get("severity")?.as_str()?.to_string(),
                        timestamp: alert.get("timestamp")?.as_str()?.to_string(),
                        resolved: alert.get("resolved")?.as_bool().unwrap_or(false),
                    })
                })
                .collect();

            Ok(if alerts.is_empty() { None } else { Some(alerts) })
        },
        Err(_) => Ok(None),
    }
}

async fn update_carrier_tracking(
    client: &supabase::Client,
    shipping_id: &str,
    carrier: &str,
    tracking_number: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // This would integrate with actual carrier APIs
    // For now, simulate an update
    let _ = client
        .from("shipping")
        .update(&serde_json::json!({
            "last_carrier_update": chrono::Utc::now().to_rfc3339(),
            "updated_at": chrono::Utc::now().to_rfc3339(),
        }))
        .eq("id", shipping_id)
        .execute()
        .await;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
