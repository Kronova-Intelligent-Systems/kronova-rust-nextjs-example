use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;

#[derive(Deserialize)]
pub struct SignOutRequest {
    pub access_token: String,
}

#[derive(Serialize)]
pub struct SignOutResponse {
    pub success: bool,
    pub message: String,
    pub error: Option<String>,
}

pub async fn handle_signout(req: SignOutRequest) -> Result<SignOutResponse, Box<dyn std::error::Error>> {
    if req.access_token.is_empty() {
        return Ok(SignOutResponse {
            success: false,
            message: "Access token is required".to_string(),
            error: Some("MISSING_TOKEN".to_string()),
        });
    }

    let client = create_supabase_client()?;

    // Verify and get user from token
    let user_result = client
        .auth()
        .get_user(&req.access_token)
        .await;

    match user_result {
        Ok(user) => {
            let user_id = user.id.to_string();
            
            // Sign out user (invalidates all sessions)
            let signout_result = client
                .auth()
                .sign_out(&req.access_token)
                .await;

            match signout_result {
                Ok(_) => {
                    // Log successful signout
                    let _ = log_auth_event(&client, &user_id, "signout_success", None).await;
                    
                    // Clear any cached user data
                    let _ = clear_user_cache(&client, &user_id).await;

                    Ok(SignOutResponse {
                        success: true,
                        message: "Signed out successfully".to_string(),
                        error: None,
                    })
                },
                Err(e) => {
                    let _ = log_auth_event(&client, &user_id, "signout_error", Some(&e.to_string())).await;
                    
                    Ok(SignOutResponse {
                        success: false,
                        message: "Failed to sign out".to_string(),
                        error: Some("SIGNOUT_ERROR".to_string()),
                    })
                }
            }
        },
        Err(_) => {
            Ok(SignOutResponse {
                success: false,
                message: "Invalid or expired token".to_string(),
                error: Some("INVALID_TOKEN".to_string()),
            })
        }
    }
}

async fn log_auth_event(
    client: &supabase::Client,
    user_id: &str,
    event_type: &str,
    error_message: Option<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    let log_entry = serde_json::json!({
        "user_id": user_id,
        "event_type": event_type,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "error_message": error_message,
        "ip_address": std::env::var("CF_CONNECTING_IP").unwrap_or_default(),
    });

    let _ = client
        .from("auth_logs")
        .insert(&log_entry)
        .execute()
        .await;

    Ok(())
}

async fn clear_user_cache(
    client: &supabase::Client,
    user_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Clear any cached session data or user preferences
    let _ = client
        .from("user_sessions")
        .delete()
        .eq("user_id", user_id)
        .execute()
        .await;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
