use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;

#[derive(Deserialize)]
pub struct SignInRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct SignInResponse {
    pub success: bool,
    pub message: String,
    pub session: Option<SessionData>,
    pub user: Option<UserProfile>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct SessionData {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
    pub token_type: String,
}

#[derive(Serialize)]
pub struct UserProfile {
    pub id: String,
    pub email: String,
    pub full_name: String,
    pub company: String,
    pub job_title: Option<String>,
    pub website: String,
    pub avatar_url: Option<String>,
    pub created_at: String,
}

pub async fn handle_signin(req: SignInRequest) -> Result<SignInResponse, Box<dyn std::error::Error>> {
    // Validate input
    if req.email.is_empty() || req.password.is_empty() {
        return Ok(SignInResponse {
            success: false,
            message: "Email and password are required".to_string(),
            session: None,
            user: None,
            error: Some("MISSING_CREDENTIALS".to_string()),
        });
    }

    let client = create_supabase_client()?;

    // Attempt authentication
    let auth_result = client
        .auth()
        .sign_in_with_password(&req.email, &req.password)
        .await;

    match auth_result {
        Ok(auth_response) => {
            let user_id = auth_response.user.id.to_string();
            
            // Fetch user profile
            let profile_result = client
                .from("profiles")
                .select("*")
                .eq("id", &user_id)
                .single()
                .execute()
                .await;

            match profile_result {
                Ok(profile_data) => {
                    let profile: UserProfile = serde_json::from_value(profile_data)?;
                    
                    // Log successful signin
                    let _ = log_auth_event(&client, &user_id, "signin_success", None).await;

                    Ok(SignInResponse {
                        success: true,
                        message: "Signed in successfully".to_string(),
                        session: Some(SessionData {
                            access_token: auth_response.session.access_token,
                            refresh_token: auth_response.session.refresh_token,
                            expires_at: auth_response.session.expires_at,
                            token_type: "Bearer".to_string(),
                        }),
                        user: Some(profile),
                        error: None,
                    })
                },
                Err(e) => {
                    let _ = log_auth_event(&client, &user_id, "profile_fetch_error", Some(&e.to_string())).await;
                    
                    Ok(SignInResponse {
                        success: false,
                        message: "Failed to fetch user profile".to_string(),
                        session: None,
                        user: None,
                        error: Some("PROFILE_ERROR".to_string()),
                    })
                }
            }
        },
        Err(e) => {
            // Log failed signin attempt
            let _ = log_auth_event(&client, &req.email, "signin_failed", Some(&e.to_string())).await;
            
            Ok(SignInResponse {
                success: false,
                message: "Invalid email or password".to_string(),
                session: None,
                user: None,
                error: Some("INVALID_CREDENTIALS".to_string()),
            })
        }
    }
}

async fn log_auth_event(
    client: &supabase::Client,
    identifier: &str,
    event_type: &str,
    error_message: Option<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    let log_entry = serde_json::json!({
        "identifier": identifier,
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

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
