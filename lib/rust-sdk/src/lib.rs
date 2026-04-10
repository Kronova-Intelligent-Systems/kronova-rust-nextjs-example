//! Kronova Rust SDK
//! 
//! Enterprise-grade SDK for leveraging Rust serverless functions across the platform.
//! Provides type-safe interfaces to Asset Gateway, AI Agents, Workflows, and Banking integrations.

pub mod assets;
pub mod plaid;
pub mod ai;
pub mod blockchain;

use serde::{Deserialize, Serialize};
use std::error::Error;

/// Standard API response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

/// Supabase client wrapper
pub struct KronovaClient {
    supabase_url: String,
    supabase_key: String,
}

impl KronovaClient {
    pub fn new(supabase_url: String, supabase_key: String) -> Self {
        Self {
            supabase_url,
            supabase_key,
        }
    }

    /// Invoke a Supabase Edge Function
    pub async fn invoke_function<T, R>(
        &self,
        function_name: &str,
        payload: &T,
    ) -> Result<ApiResponse<R>, Box<dyn Error>>
    where
        T: Serialize,
        R: for<'de> Deserialize<'de>,
    {
        let url = format!("{}/functions/v1/{}", self.supabase_url, function_name);
        
        let client = reqwest::Client::new();
        let response = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.supabase_key))
            .header("Content-Type", "application/json")
            .json(payload)
            .send()
            .await?;

        if response.status().is_success() {
            let result: ApiResponse<R> = response.json().await?;
            Ok(result)
        } else {
            let error_text = response.text().await?;
            Err(format!("Function invocation failed: {}", error_text).into())
        }
    }
}
