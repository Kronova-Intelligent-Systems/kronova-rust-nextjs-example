use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;

#[derive(Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Serialize)]
pub struct ForgotPasswordResponse {
    pub success: bool,
    pub message: String,
    pub error: Option<String>,
}

pub async fn handle_forgot_password(req: ForgotPasswordRequest) -> Result<ForgotPasswordResponse, Box<dyn std::error::Error>> {
    if req.email.is_empty() || !is_valid_email(&req.email) {
        return Ok(ForgotPasswordResponse {
            success: false,
            message: "Valid email address is required".to_string(),
            error: Some("INVALID_EMAIL".to_string()),
        });
    }

    let client = create_supabase_client()?;

    // Check if user exists (but don't reveal this information for security)
    let user_exists = client
        .from("profiles")
        .select("id")
        .eq("email", &req.email)
        .single()
        .execute()
        .await
        .is_ok();

    if user_exists {
        // Send password reset email
        let reset_result = client
            .auth()
            .reset_password_for_email(&req.email, Some(&get_reset_redirect_url()))
            .await;

        match reset_result {
            Ok(_) => {
                // Log password reset request
                let _ = log_auth_event(&client, &req.email, "password_reset_requested", None).await;
                
                Ok(ForgotPasswordResponse {
                    success: true,
                    message: "If an account with that email exists, we've sent a password reset link.".to_string(),
                    error: None,
                })
            },
            Err(e) => {
                let _ = log_auth_event(&client, &req.email, "password_reset_error", Some(&e.to_string())).await;
                
                // Still return success to prevent email enumeration
                Ok(ForgotPasswordResponse {
                    success: true,
                    message: "If an account with that email exists, we've sent a password reset link.".to_string(),
                    error: None,
                })
            }
        }
    } else {
        // Log attempt for non-existent email
        let _ = log_auth_event(&client, &req.email, "password_reset_nonexistent", None).await;
        
        // Return success message to prevent email enumeration
        Ok(ForgotPasswordResponse {
            success: true,
            message: "If an account with that email exists, we've sent a password reset link.".to_string(),
            error: None,
        })
    }
}

fn get_reset_redirect_url() -> String {
    std::env::var("RESET_PASSWORD_REDIRECT_URL")
        .unwrap_or_else(|_| "https://app.resend-it.com/auth/reset-password".to_string())
}

async fn log_auth_event(
    client: &supabase::Client,
    email: &str,
    event_type: &str,
    error_message: Option<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    let log_entry = serde_json::json!({
        "email": email,
        "event_type": event_type,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "error_message": error_message,
        "ip_address": std::env::var("CF_CONNECTING_IP").unwrap_or_default(),
        "user_agent": std::env::var("HTTP_USER_AGENT").unwrap_or_default(),
    });

    let _ = client
        .from("auth_logs")
        .insert(&log_entry)
        .execute()
        .await;

    Ok(())
}

fn is_valid_email(email: &str) -> bool {
    let email_regex = regex::Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    email_regex.is_match(email)
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
