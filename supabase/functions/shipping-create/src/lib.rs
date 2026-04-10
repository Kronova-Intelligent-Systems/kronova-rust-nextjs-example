use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateShippingRequest {
    pub tracking_number: String,
    pub carrier: String,
    pub service_level: String,
    pub origin_address: serde_json::Value,
    pub destination_address: serde_json::Value,
    pub shipping_date: Option<String>,
    pub estimated_delivery: Option<String>,
    pub package_ids: Option<Vec<String>>,
    pub weight: Option<f64>,
    pub dimensions: Option<ShippingDimensions>,
    pub shipping_cost: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
    pub iot_sensor_id: Option<String>,
    pub is_refrigerated: Option<bool>,
    pub temperature_range: Option<TemperatureRange>,
}

#[derive(Deserialize, Serialize)]
pub struct ShippingDimensions {
    pub length: f64,
    pub width: f64,
    pub height: f64,
    pub unit: String, // "cm" or "in"
}

#[derive(Deserialize, Serialize)]
pub struct TemperatureRange {
    pub min: f64,
    pub max: f64,
    pub unit: String, // "C" or "F"
}

#[derive(Serialize)]
pub struct CreateShippingResponse {
    pub success: bool,
    pub data: Option<ShippingData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct ShippingData {
    pub id: String,
    pub tracking_number: String,
    pub carrier: String,
    pub status: String,
    pub estimated_delivery: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn handle_create_shipping(
    req: CreateShippingRequest,
    user_id: String,
) -> Result<CreateShippingResponse, Box<dyn std::error::Error>> {
    // Validate required fields
    if req.tracking_number.trim().is_empty() {
        return Ok(CreateShippingResponse {
            success: false,
            data: None,
            error: Some("Tracking number is required".to_string()),
        });
    }

    if req.carrier.trim().is_empty() {
        return Ok(CreateShippingResponse {
            success: false,
            data: None,
            error: Some("Carrier is required".to_string()),
        });
    }

    // Validate carrier
    if !is_valid_carrier(&req.carrier) {
        return Ok(CreateShippingResponse {
            success: false,
            data: None,
            error: Some("Invalid carrier".to_string()),
        });
    }

    // Validate addresses
    if !is_valid_address(&req.origin_address) || !is_valid_address(&req.destination_address) {
        return Ok(CreateShippingResponse {
            success: false,
            data: None,
            error: Some("Invalid origin or destination address".to_string()),
        });
    }

    let client = create_supabase_client()?;

    // Check if tracking number already exists
    let existing_shipment = client
        .from("shipping")
        .select("id")
        .eq("tracking_number", &req.tracking_number)
        .eq("user_id", &user_id)
        .single()
        .execute()
        .await;

    if existing_shipment.is_ok() {
        return Ok(CreateShippingResponse {
            success: false,
            data: None,
            error: Some("Tracking number already exists".to_string()),
        });
    }

    // Validate package IDs if provided
    if let Some(package_ids) = &req.package_ids {
        let valid_packages = validate_package_ids(&client, package_ids, &user_id).await?;
        if !valid_packages {
            return Ok(CreateShippingResponse {
                success: false,
                data: None,
                error: Some("One or more package IDs are invalid".to_string()),
            });
        }
    }

    // Calculate estimated delivery if not provided
    let estimated_delivery = req.estimated_delivery.or_else(|| {
        calculate_estimated_delivery(&req.carrier, &req.service_level, req.shipping_date.as_deref())
    });

    // Create shipping record
    let shipping_insert = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "tracking_number": req.tracking_number,
        "carrier": req.carrier,
        "service_level": req.service_level,
        "origin_address": req.origin_address,
        "destination_address": req.destination_address,
        "shipping_date": req.shipping_date.unwrap_or_else(|| chrono::Utc::now().format("%Y-%m-%d").to_string()),
        "estimated_delivery": estimated_delivery,
        "package_ids": req.package_ids.unwrap_or_default(),
        "weight": req.weight,
        "dimensions": req.dimensions,
        "shipping_cost": req.shipping_cost,
        "currency": req.currency.unwrap_or_else(|| "USD".to_string()),
        "notes": req.notes,
        "iot_sensor_id": req.iot_sensor_id,
        "is_refrigerated": req.is_refrigerated.unwrap_or(false),
        "temperature_range": req.temperature_range,
        "status": "created",
        "user_id": user_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let result = client
        .from("shipping")
        .insert(&shipping_insert)
        .select("id, tracking_number, carrier, status, estimated_delivery, created_at, updated_at")
        .single()
        .execute()
        .await;

    match result {
        Ok(shipping_data) => {
            let shipping: ShippingData = serde_json::from_value(shipping_data)?;
            
            // Create initial tracking event
            let _ = create_tracking_event(&client, &shipping.id, "created", "Shipment created", None).await;
            
            // Setup IoT sensor monitoring if provided
            if let Some(sensor_id) = &req.iot_sensor_id {
                let _ = setup_sensor_monitoring(&client, &shipping.id, sensor_id).await;
            }

            // Integrate with carrier API for real-time tracking
            let _ = setup_carrier_integration(&client, &shipping.id, &req.carrier, &req.tracking_number).await;

            Ok(CreateShippingResponse {
                success: true,
                data: Some(shipping),
                error: None,
            })
        },
        Err(e) => Ok(CreateShippingResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create shipping record: {}", e)),
        }),
    }
}

fn is_valid_carrier(carrier: &str) -> bool {
    let valid_carriers = [
        "UPS", "FedEx", "DHL", "USPS", "Amazon", "OnTrac", 
        "LaserShip", "GSO", "Purolator", "Canada Post"
    ];
    valid_carriers.iter().any(|&c| c.eq_ignore_ascii_case(carrier))
}

fn is_valid_address(address: &serde_json::Value) -> bool {
    if let Some(addr_obj) = address.as_object() {
        addr_obj.contains_key("street") && 
        addr_obj.contains_key("city") && 
        addr_obj.contains_key("country")
    } else {
        false
    }
}

async fn validate_package_ids(
    client: &supabase::Client,
    package_ids: &[String],
    user_id: &str,
) -> Result<bool, Box<dyn std::error::Error>> {
    for package_id in package_ids {
        let result = client
            .from("packages")
            .select("id")
            .eq("id", package_id)
            .eq("user_id", user_id)
            .single()
            .execute()
            .await;

        if result.is_err() {
            return Ok(false);
        }
    }
    Ok(true)
}

fn calculate_estimated_delivery(
    carrier: &str,
    service_level: &str,
    shipping_date: Option<&str>,
) -> Option<String> {
    let base_date = if let Some(date_str) = shipping_date {
        chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d").ok()?
    } else {
        chrono::Utc::now().date_naive()
    };

    let delivery_days = match (carrier.to_uppercase().as_str(), service_level.to_lowercase().as_str()) {
        ("UPS", "next_day") | ("FEDEX", "overnight") => 1,
        ("UPS", "2_day") | ("FEDEX", "2day") => 2,
        ("UPS", "ground") | ("FEDEX", "ground") => 5,
        ("USPS", "priority") => 3,
        ("USPS", "ground") => 7,
        ("DHL", "express") => 2,
        ("DHL", "standard") => 5,
        _ => 5, // default
    };

    let estimated_date = base_date + chrono::Duration::days(delivery_days);
    Some(estimated_date.format("%Y-%m-%d").to_string())
}

async fn create_tracking_event(
    client: &supabase::Client,
    shipping_id: &str,
    event_type: &str,
    description: &str,
    location: Option<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    let event = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "shipping_id": shipping_id,
        "event_type": event_type,
        "description": description,
        "location": location,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "metadata": serde_json::json!({}),
    });

    let _ = client
        .from("shipping_events")
        .insert(&event)
        .execute()
        .await;

    Ok(())
}

async fn setup_sensor_monitoring(
    client: &supabase::Client,
    shipping_id: &str,
    sensor_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Link sensor to shipment for monitoring
    let sensor_link = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "shipping_id": shipping_id,
        "sensor_id": sensor_id,
        "monitoring_active": true,
        "alert_thresholds": serde_json::json!({
            "temperature_min": -10.0,
            "temperature_max": 30.0,
            "humidity_max": 80.0,
            "shock_threshold": 5.0
        }),
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("shipping_sensor_links")
        .insert(&sensor_link)
        .execute()
        .await;

    Ok(())
}

async fn setup_carrier_integration(
    client: &supabase::Client,
    shipping_id: &str,
    carrier: &str,
    tracking_number: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Setup webhook or polling for carrier tracking updates
    let integration = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "shipping_id": shipping_id,
        "carrier": carrier,
        "tracking_number": tracking_number,
        "integration_type": "webhook",
        "webhook_url": format!("https://api.resend-it.com/webhooks/shipping/{}", shipping_id),
        "polling_interval": 3600, // 1 hour
        "is_active": true,
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("carrier_integrations")
        .insert(&integration)
        .execute()
        .await;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
