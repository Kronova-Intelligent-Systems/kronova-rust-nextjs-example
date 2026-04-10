use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SignUpRequest {
    pub full_name: String,
    pub email: String,
    pub company: String,
    pub job_title: Option<String>,
    pub website: String,
    pub linkedin_url: Option<String>,
    pub avatar_url: Option<String>,
    pub company_logo_url: Option<String>,
    pub password: String,
}

#[derive(Serialize)]
pub struct SignUpResponse {
    pub success: bool,
    pub message: String,
    pub user_id: Option<String>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct ProfileInsert {
    pub id: String,
    pub full_name: String,
    pub email: String,
    pub company: String,
    pub job_title: Option<String>,
    pub website: String,
    pub linkedin_url: Option<String>,
    pub avatar_url: Option<String>,
    pub company_logo_url: Option<String>,
}

pub async fn handle_signup(req: SignUpRequest) -> Result<SignUpResponse, Box<dyn std::error::Error>> {
    // Validate email format
    if !is_valid_email(&req.email) {
        return Ok(SignUpResponse {
            success: false,
            message: "Invalid email format".to_string(),
            user_id: None,
            error: Some("INVALID_EMAIL".to_string()),
        });
    }

    // Validate password strength
    if !is_strong_password(&req.password) {
        return Ok(SignUpResponse {
            success: false,
            message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character".to_string(),
            user_id: None,
            error: Some("WEAK_PASSWORD".to_string()),
        });
    }

    // Validate website URL
    if !is_valid_url(&req.website) {
        return Ok(SignUpResponse {
            success: false,
            message: "Invalid website URL format".to_string(),
            user_id: None,
            error: Some("INVALID_URL".to_string()),
        });
    }

    let client = create_supabase_client()?;
    
    // Check if email already exists
    let existing_user = client
        .from("profiles")
        .select("id")
        .eq("email", &req.email)
        .single()
        .execute()
        .await;

    if existing_user.is_ok() {
        return Ok(SignUpResponse {
            success: false,
            message: "Email already registered".to_string(),
            user_id: None,
            error: Some("EMAIL_EXISTS".to_string()),
        });
    }

    // Create auth user
    let auth_response = client
        .auth()
        .sign_up(&req.email, &req.password)
        .await?;

    let user_id = auth_response.user.id.to_string();

    // Create profile record
    let profile = ProfileInsert {
        id: user_id.clone(),
        full_name: req.full_name,
        email: req.email,
        company: req.company,
        job_title: req.job_title,
        website: req.website,
        linkedin_url: req.linkedin_url,
        avatar_url: req.avatar_url,
        company_logo_url: req.company_logo_url,
    };

    let profile_result = client
        .from("profiles")
        .insert(&profile)
        .execute()
        .await;

    match profile_result {
        Ok(_) => Ok(SignUpResponse {
            success: true,
            message: "Account created successfully. Please check your email for verification.".to_string(),
            user_id: Some(user_id),
            error: None,
        }),
        Err(e) => {
            // Cleanup auth user if profile creation fails
            let _ = client.auth().admin().delete_user(&user_id).await;
            
            Ok(SignUpResponse {
                success: false,
                message: "Failed to create user profile".to_string(),
                user_id: None,
                error: Some(format!("PROFILE_ERROR: {}", e)),
            })
        }
    }
}

fn is_valid_email(email: &str) -> bool {
    let email_regex = regex::Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    email_regex.is_match(email)
}

fn is_strong_password(password: &str) -> bool {
    password.len() >= 8
        && password.chars().any(|c| c.is_uppercase())
        && password.chars().any(|c| c.is_lowercase())
        && password.chars().any(|c| c.is_numeric())
        && password.chars().any(|c| !c.is_alphanumeric())
}

fn is_valid_url(url: &str) -> bool {
    url::Url::parse(url).is_ok()
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
