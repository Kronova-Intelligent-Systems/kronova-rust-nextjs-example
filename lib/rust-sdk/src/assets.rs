use serde::{Deserialize, Serialize};
use super::{ApiResponse, KronovaClient};
use std::error::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct Asset {
    pub id: String,
    pub asset_id: String,
    pub name: String,
    pub asset_type: String,
    pub category: Option<String>,
    pub description: Option<String>,
    pub current_value: Option<f64>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct CreateAssetRequest {
    pub asset_id: String,
    pub name: String,
    pub asset_type: String,
    pub category: Option<String>,
    pub description: Option<String>,
    pub purchase_cost: Option<f64>,
    pub current_value: Option<f64>,
    pub status: String,
}

impl KronovaClient {
    pub async fn create_asset(&self, req: CreateAssetRequest) -> Result<ApiResponse<Asset>, Box<dyn Error>> {
        self.invoke_function("assets-create", &req).await
    }

    pub async fn list_assets(&self) -> Result<ApiResponse<Vec<Asset>>, Box<dyn Error>> {
        self.invoke_function("assets-list", &serde_json::json!({})).await
    }

    pub async fn delete_asset(&self, asset_id: &str) -> Result<ApiResponse<()>, Box<dyn Error>> {
        self.invoke_function("assets-delete", &serde_json::json!({"asset_id": asset_id})).await
    }
}
