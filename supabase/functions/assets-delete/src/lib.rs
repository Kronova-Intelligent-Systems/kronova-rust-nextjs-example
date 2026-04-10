use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;

#[derive(Serialize)]
pub struct DeleteAssetResponse {
    pub success: bool,
    pub message: String,
    pub error: Option<String>,
}

pub async fn handle_delete_asset(
    asset_id: String,
    user_id: String,
) -> Result<DeleteAssetResponse, Box<dyn std::error::Error>> {
    let client = create_supabase_client()?;

    // Verify asset exists and belongs to user
    let existing_asset = client
        .from("assets")
        .select("id, name, asset_id, status")
        .eq("id", &asset_id)
        .eq("user_id", &user_id)
        .single()
        .execute()
        .await;

    let asset_data = match existing_asset {
        Ok(data) => data,
        Err(_) => return Ok(DeleteAssetResponse {
            success: false,
            message: "Asset not found or access denied".to_string(),
            error: Some("ASSET_NOT_FOUND".to_string()),
        }),
    };

    let asset_name = asset_data.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
    let asset_code = asset_data.get("asset_id").and_then(|v| v.as_str()).unwrap_or("");

    // Check if asset has active dependencies
    let dependencies = check_asset_dependencies(&client, &asset_id).await?;
    if !dependencies.is_empty() {
        return Ok(DeleteAssetResponse {
            success: false,
            message: format!("Cannot delete asset. It has active dependencies: {}", dependencies.join(", ")),
            error: Some("ACTIVE_DEPENDENCIES".to_string()),
        });
    }

    // Create final lifecycle event before deletion
    let _ = create_lifecycle_event(&client, &asset_id, "deleted", &format!("Asset {} deleted", asset_name)).await;

    // Archive related data instead of hard delete
    let archive_result = archive_asset_data(&client, &asset_id).await;
    
    match archive_result {
        Ok(_) => {
            // Soft delete the asset (mark as deleted)
            let delete_result = client
                .from("assets")
                .update(&serde_json::json!({
                    "status": "deleted",
                    "deleted_at": chrono::Utc::now().to_rfc3339(),
                    "updated_at": chrono::Utc::now().to_rfc3339()
                }))
                .eq("id", &asset_id)
                .eq("user_id", &user_id)
                .execute()
                .await;

            match delete_result {
                Ok(_) => Ok(DeleteAssetResponse {
                    success: true,
                    message: format!("Asset '{}' has been successfully deleted", asset_name),
                    error: None,
                }),
                Err(e) => Ok(DeleteAssetResponse {
                    success: false,
                    message: "Failed to delete asset".to_string(),
                    error: Some(format!("DELETE_ERROR: {}", e)),
                }),
            }
        },
        Err(e) => Ok(DeleteAssetResponse {
            success: false,
            message: "Failed to archive asset data".to_string(),
            error: Some(format!("ARCHIVE_ERROR: {}", e)),
        }),
    }
}

async fn check_asset_dependencies(
    client: &supabase::Client,
    asset_id: &str,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let mut dependencies = Vec::new();

    // Check for active workflows
    if let Ok(workflows) = client
        .from("ai_workflows")
        .select("count")
        .contains("asset_ids", &format!("[\"{}\"]", asset_id))
        .eq("is_active", true)
        .single()
        .execute()
        .await
    {
        if let Some(count) = workflows.get("count").and_then(|v| v.as_i64()) {
            if count > 0 {
                dependencies.push(format!("{} active workflows", count));
            }
        }
    }

    // Check for active shipping records
    if let Ok(shipments) = client
        .from("shipping")
        .select("count")
        .contains("package_ids", &format!("[\"{}\"]", asset_id))
        .neq("status", "delivered")
        .single()
        .execute()
        .await
    {
        if let Some(count) = shipments.get("count").and_then(|v| v.as_i64()) {
            if count > 0 {
                dependencies.push(format!("{} active shipments", count));
            }
        }
    }

    // Check for active IoT sensors
    if let Ok(sensors) = client
        .from("iot_sensors")
        .select("count")
        .eq("asset_id", asset_id)
        .eq("is_active", true)
        .single()
        .execute()
        .await
    {
        if let Some(count) = sensors.get("count").and_then(|v| v.as_i64()) {
            if count > 0 {
                dependencies.push(format!("{} active IoT sensors", count));
            }
        }
    }

    Ok(dependencies)
}

async fn archive_asset_data(
    client: &supabase::Client,
    asset_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Archive lifecycle events
    let _ = client
        .from("asset_lifecycle_events")
        .update(&serde_json::json!({
            "archived": true,
            "archived_at": chrono::Utc::now().to_rfc3339()
        }))
        .eq("asset_id", asset_id)
        .execute()
        .await;

    // Archive insights
    let _ = client
        .from("asset_insights")
        .update(&serde_json::json!({
            "archived": true,
            "archived_at": chrono::Utc::now().to_rfc3339()
        }))
        .eq("asset_id", asset_id)
        .execute()
        .await;

    // Archive maintenance records
    let _ = client
        .from("maintenance_records")
        .update(&serde_json::json!({
            "archived": true,
            "archived_at": chrono::Utc::now().to_rfc3339()
        }))
        .eq("asset_id", asset_id)
        .execute()
        .await;

    Ok(())
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
