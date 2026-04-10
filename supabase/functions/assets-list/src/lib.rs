use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;

#[derive(Deserialize)]
pub struct ListAssetsRequest {
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub status: Option<String>,
    pub asset_type: Option<String>,
    pub category: Option<String>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Serialize)]
pub struct ListAssetsResponse {
    pub success: bool,
    pub data: Option<AssetsData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct AssetsData {
    pub assets: Vec<AssetSummary>,
    pub total: i32,
    pub page: i32,
    pub limit: i32,
    pub total_pages: i32,
}

#[derive(Serialize)]
pub struct AssetSummary {
    pub id: String,
    pub asset_id: String,
    pub name: String,
    pub asset_type: String,
    pub category: Option<String>,
    pub status: String,
    pub current_value: Option<f64>,
    pub current_location: Option<serde_json::Value>,
    pub risk_score: Option<f64>,
    pub last_maintenance: Option<String>,
    pub iot_sensor_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn handle_list_assets(
    req: ListAssetsRequest,
    user_id: String,
) -> Result<ListAssetsResponse, Box<dyn std::error::Error>> {
    let client = create_supabase_client()?;
    
    let page = req.page.unwrap_or(1).max(1);
    let limit = req.limit.unwrap_or(20).min(100).max(1);
    let offset = (page - 1) * limit;

    // Build query
    let mut query = client
        .from("assets")
        .select("id, asset_id, name, asset_type, category, status, current_value, current_location, risk_score, created_at, updated_at")
        .eq("user_id", &user_id);

    // Apply filters
    if let Some(status) = &req.status {
        query = query.eq("status", status);
    }

    if let Some(asset_type) = &req.asset_type {
        query = query.eq("asset_type", asset_type);
    }

    if let Some(category) = &req.category {
        query = query.eq("category", category);
    }

    if let Some(search) = &req.search {
        query = query.or(&format!("name.ilike.%{}%,description.ilike.%{}%", search, search));
    }

    // Apply sorting
    let sort_column = req.sort_by.as_deref().unwrap_or("created_at");
    let sort_order = req.sort_order.as_deref().unwrap_or("desc");
    let order_clause = format!("{}.{}", sort_column, sort_order);
    query = query.order(&order_clause);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    let result = query.execute().await;

    match result {
        Ok(assets_data) => {
            let assets: Vec<AssetSummary> = serde_json::from_value(assets_data)?;
            
            // Get total count for pagination
            let total_result = client
                .from("assets")
                .select("count")
                .eq("user_id", &user_id)
                .single()
                .execute()
                .await;

            let total = match total_result {
                Ok(count_data) => {
                    count_data.get("count").and_then(|v| v.as_i64()).unwrap_or(0) as i32
                },
                Err(_) => assets.len() as i32,
            };

            let total_pages = (total as f32 / limit as f32).ceil() as i32;

            // Enrich assets with additional data
            let enriched_assets = enrich_assets_data(&client, assets).await?;

            Ok(ListAssetsResponse {
                success: true,
                data: Some(AssetsData {
                    assets: enriched_assets,
                    total,
                    page,
                    limit,
                    total_pages,
                }),
                error: None,
            })
        },
        Err(e) => Ok(ListAssetsResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to fetch assets: {}", e)),
        }),
    }
}

async fn enrich_assets_data(
    client: &supabase::Client,
    mut assets: Vec<AssetSummary>,
) -> Result<Vec<AssetSummary>, Box<dyn std::error::Error>> {
    // Get last maintenance dates for assets
    for asset in &mut assets {
        if let Ok(maintenance_data) = client
            .from("asset_lifecycle_events")
            .select("timestamp")
            .eq("asset_id", &asset.id)
            .eq("event_type", "maintenance")
            .order("timestamp.desc")
            .limit(1)
            .single()
            .execute()
            .await
        {
            if let Some(timestamp) = maintenance_data.get("timestamp") {
                asset.last_maintenance = timestamp.as_str().map(|s| s.to_string());
            }
        }
    }

    Ok(assets)
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
