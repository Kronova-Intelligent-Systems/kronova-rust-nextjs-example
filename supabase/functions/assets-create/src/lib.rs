use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateAssetRequest {
    pub asset_id: String,
    pub name: String,
    pub asset_type: String,
    pub category: Option<String>,
    pub description: Option<String>,
    pub purchase_cost: Option<f64>,
    pub purchase_date: Option<String>,
    pub current_value: Option<f64>,
    pub status: String,
    pub specifications: Option<serde_json::Value>,
    pub current_location: Option<serde_json::Value>,
    pub iot_sensor_id: Option<String>,
    pub nfc_tag_id: Option<String>,
    pub qr_code: Option<String>,
    pub ai_agent_config: Option<serde_json::Value>,
    pub workflow_settings: Option<serde_json::Value>,
    pub maintenance_schedule: Option<serde_json::Value>,
    pub compliance_data: Option<serde_json::Value>,
    pub esg_metrics: Option<serde_json::Value>,
    pub predictive_data: Option<serde_json::Value>,
    pub risk_score: Option<f64>,
    pub depreciation_rate: Option<f64>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Serialize)]
pub struct CreateAssetResponse {
    pub success: bool,
    pub data: Option<AssetData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct AssetData {
    pub id: String,
    pub asset_id: String,
    pub name: String,
    pub asset_type: String,
    pub status: String,
    pub current_value: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn handle_create_asset(
    req: CreateAssetRequest,
    user_id: String,
) -> Result<CreateAssetResponse, Box<dyn std::error::Error>> {
    // Validate required fields
    if req.name.trim().is_empty() {
        return Ok(CreateAssetResponse {
            success: false,
            data: None,
            error: Some("Asset name is required".to_string()),
        });
    }

    if req.asset_type.trim().is_empty() {
        return Ok(CreateAssetResponse {
            success: false,
            data: None,
            error: Some("Asset type is required".to_string()),
        });
    }

    // Validate status
    let valid_statuses = ["active", "inactive", "maintenance", "retired"];
    if !valid_statuses.contains(&req.status.as_str()) {
        return Ok(CreateAssetResponse {
            success: false,
            data: None,
            error: Some("Invalid asset status".to_string()),
        });
    }

    let client = create_supabase_client()?;

    // Check if asset_id already exists for this user
    let existing_asset = client
        .from("assets")
        .select("id")
        .eq("asset_id", &req.asset_id)
        .eq("user_id", &user_id)
        .single()
        .execute()
        .await;

    if existing_asset.is_ok() {
        return Ok(CreateAssetResponse {
            success: false,
            data: None,
            error: Some("Asset ID already exists".to_string()),
        });
    }

    // Generate embedding vector for asset description if provided
    let embedding_vector = if let Some(desc) = &req.description {
        generate_embedding_vector(desc).await.ok()
    } else {
        None
    };

    // Create asset record
    let asset_insert = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "asset_id": req.asset_id,
        "name": req.name,
        "asset_type": req.asset_type,
        "category": req.category,
        "description": req.description,
        "purchase_cost": req.purchase_cost,
        "purchase_date": req.purchase_date,
        "current_value": req.current_value,
        "status": req.status,
        "specifications": req.specifications,
        "current_location": req.current_location,
        "iot_sensor_id": req.iot_sensor_id,
        "nfc_tag_id": req.nfc_tag_id,
        "qr_code": req.qr_code,
        "ai_agent_config": req.ai_agent_config,
        "workflow_settings": req.workflow_settings,
        "maintenance_schedule": req.maintenance_schedule,
        "compliance_data": req.compliance_data,
        "esg_metrics": req.esg_metrics,
        "predictive_data": req.predictive_data,
        "risk_score": req.risk_score,
        "depreciation_rate": req.depreciation_rate,
        "metadata": req.metadata,
        "embedding_vector": embedding_vector,
        "user_id": user_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let result = client
        .from("assets")
        .insert(&asset_insert)
        .select("id, asset_id, name, asset_type, status, current_value, created_at, updated_at")
        .single()
        .execute()
        .await;

    match result {
        Ok(asset_data) => {
            let asset: AssetData = serde_json::from_value(asset_data)?;
            
            // Create initial lifecycle event
            let _ = create_lifecycle_event(&client, &asset.id, "created", "Asset created").await;
            
            // Generate QR code if not provided
            if req.qr_code.is_none() {
                let _ = generate_qr_code(&client, &asset.id, &asset.asset_id).await;
            }

            Ok(CreateAssetResponse {
                success: true,
                data: Some(asset),
                error: None,
            })
        },
        Err(e) => Ok(CreateAssetResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create asset: {}", e)),
        }),
    }
}

async fn generate_embedding_vector(text: &str) -> Result<String, Box<dyn std::error::Error>> {
    // This would integrate with an AI service to generate embeddings
    // For now, return a placeholder
    Ok("placeholder_embedding_vector".to_string())
}

async fn create_lifecycle_event(
    client: &supabase::Client,
    asset_id: &str,
    event_type: &str,
    description: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let event = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "asset_id": asset_id,
        "event_type": event_type,
        "description": description,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "metadata": serde_json::json!({}),
    });

    let _ = client
        .from("asset_lifecycle_events")
        .insert(&event)
        .execute()
        .await;

    Ok(())
}

async fn generate_qr_code(
    client: &supabase::Client,
    asset_id: &str,
    asset_code: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let qr_data = format!("https://app.resend-it.com/assets/{}", asset_code);
    
    // Update asset with QR code data
    let _ = client
        .from("assets")
        .update(&serde_json::json!({"qr_code": qr_data}))
        .eq("id", asset_id)
        .execute()
        .await;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
