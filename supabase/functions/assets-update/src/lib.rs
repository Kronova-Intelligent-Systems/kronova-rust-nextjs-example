use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;

#[derive(Deserialize)]
pub struct UpdateAssetRequest {
    pub name: Option<String>,
    pub asset_type: Option<String>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub current_value: Option<f64>,
    pub status: Option<String>,
    pub specifications: Option<serde_json::Value>,
    pub current_location: Option<serde_json::Value>,
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
pub struct UpdateAssetResponse {
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
    pub updated_at: String,
}

pub async fn handle_update_asset(
    asset_id: String,
    req: UpdateAssetRequest,
    user_id: String,
) -> Result<UpdateAssetResponse, Box<dyn std::error::Error>> {
    let client = create_supabase_client()?;

    // Verify asset exists and belongs to user
    let existing_asset = client
        .from("assets")
        .select("id, name, status, current_value")
        .eq("id", &asset_id)
        .eq("user_id", &user_id)
        .single()
        .execute()
        .await;

    let original_asset = match existing_asset {
        Ok(asset_data) => asset_data,
        Err(_) => return Ok(UpdateAssetResponse {
            success: false,
            data: None,
            error: Some("Asset not found or access denied".to_string()),
        }),
    };

    // Validate status if provided
    if let Some(status) = &req.status {
        let valid_statuses = ["active", "inactive", "maintenance", "retired"];
        if !valid_statuses.contains(&status.as_str()) {
            return Ok(UpdateAssetResponse {
                success: false,
                data: None,
                error: Some("Invalid asset status".to_string()),
            });
        }
    }

    // Build update object with only provided fields
    let mut update_data = serde_json::Map::new();
    
    if let Some(name) = req.name {
        if !name.trim().is_empty() {
            update_data.insert("name".to_string(), serde_json::Value::String(name));
        }
    }
    
    if let Some(asset_type) = req.asset_type {
        update_data.insert("asset_type".to_string(), serde_json::Value::String(asset_type));
    }
    
    if let Some(category) = req.category {
        update_data.insert("category".to_string(), serde_json::Value::String(category));
    }
    
    if let Some(description) = req.description {
        update_data.insert("description".to_string(), serde_json::Value::String(description.clone()));
        
        // Update embedding vector if description changed
        if let Ok(embedding) = generate_embedding_vector(&description).await {
            update_data.insert("embedding_vector".to_string(), serde_json::Value::String(embedding));
        }
    }
    
    if let Some(current_value) = req.current_value {
        update_data.insert("current_value".to_string(), serde_json::Value::from(current_value));
    }
    
    if let Some(status) = req.status {
        update_data.insert("status".to_string(), serde_json::Value::String(status));
    }
    
    if let Some(specifications) = req.specifications {
        update_data.insert("specifications".to_string(), specifications);
    }
    
    if let Some(current_location) = req.current_location {
        update_data.insert("current_location".to_string(), current_location);
    }
    
    if let Some(ai_agent_config) = req.ai_agent_config {
        update_data.insert("ai_agent_config".to_string(), ai_agent_config);
    }
    
    if let Some(workflow_settings) = req.workflow_settings {
        update_data.insert("workflow_settings".to_string(), workflow_settings);
    }
    
    if let Some(maintenance_schedule) = req.maintenance_schedule {
        update_data.insert("maintenance_schedule".to_string(), maintenance_schedule);
    }
    
    if let Some(compliance_data) = req.compliance_data {
        update_data.insert("compliance_data".to_string(), compliance_data);
    }
    
    if let Some(esg_metrics) = req.esg_metrics {
        update_data.insert("esg_metrics".to_string(), esg_metrics);
    }
    
    if let Some(predictive_data) = req.predictive_data {
        update_data.insert("predictive_data".to_string(), predictive_data);
    }
    
    if let Some(risk_score) = req.risk_score {
        update_data.insert("risk_score".to_string(), serde_json::Value::from(risk_score));
    }
    
    if let Some(depreciation_rate) = req.depreciation_rate {
        update_data.insert("depreciation_rate".to_string(), serde_json::Value::from(depreciation_rate));
    }
    
    if let Some(metadata) = req.metadata {
        update_data.insert("metadata".to_string(), metadata);
    }

    // Always update the timestamp
    update_data.insert("updated_at".to_string(), serde_json::Value::String(chrono::Utc::now().to_rfc3339()));

    if update_data.is_empty() {
        return Ok(UpdateAssetResponse {
            success: false,
            data: None,
            error: Some("No valid fields provided for update".to_string()),
        });
    }

    let result = client
        .from("assets")
        .update(&serde_json::Value::Object(update_data))
        .eq("id", &asset_id)
        .eq("user_id", &user_id)
        .select("id, asset_id, name, asset_type, status, current_value, updated_at")
        .single()
        .execute()
        .await;

    match result {
        Ok(asset_data) => {
            let asset: AssetData = serde_json::from_value(asset_data)?;
            
            // Create lifecycle event for significant changes
            let original_status = original_asset.get("status").and_then(|v| v.as_str()).unwrap_or("");
            let new_status = asset.status.as_str();
            
            if original_status != new_status {
                let description = format!("Status changed from {} to {}", original_status, new_status);
                let _ = create_lifecycle_event(&client, &asset.id, "status_change", &description).await;
            }

            Ok(UpdateAssetResponse {
                success: true,
                data: Some(asset),
                error: None,
            })
        },
        Err(e) => Ok(UpdateAssetResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to update asset: {}", e)),
        }),
    }
}

async fn generate_embedding_vector(text: &str) -> Result<String, Box<dyn std::error::Error>> {
    // This would integrate with an AI service to generate embeddings
    // For now, return a placeholder
    Ok("updated_embedding_vector".to_string())
}

async fn create_lifecycle_event(
    client: &supabase::Client,
    asset_id: &str,
    event_type: &str,
    description: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let event = serde_json::json!({
        "id": uuid::Uuid::new_v4().to_string(),
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

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
