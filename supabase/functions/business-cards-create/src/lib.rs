use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateBusinessCardRequest {
    pub name: String,
    pub title: Option<String>,
    pub company: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub website: Option<String>,
    pub social_links: Option<serde_json::Value>,
    pub design_template: Option<String>,
    pub custom_fields: Option<serde_json::Value>,
    pub privacy_settings: Option<serde_json::Value>,
    pub nft_enabled: Option<bool>,
}

#[derive(Serialize)]
pub struct CreateBusinessCardResponse {
    pub success: bool,
    pub data: Option<BusinessCardData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct BusinessCardData {
    pub id: String,
    pub name: String,
    pub qr_code_url: String,
    pub share_url: String,
    pub nft_token_id: Option<String>,
    pub created_at: String,
}

pub async fn handle_create_business_card(
    req: CreateBusinessCardRequest,
    user_id: String,
) -> Result<CreateBusinessCardResponse, Box<dyn std::error::Error>> {
    let client = create_supabase_client()?;

    // Validate required fields
    if req.name.trim().is_empty() {
        return Ok(CreateBusinessCardResponse {
            success: false,
            data: None,
            error: Some("Name is required".to_string()),
        });
    }

    let card_id = Uuid::new_v4().to_string();
    let share_url = format!("https://resendit.ai/card/{}", card_id);

    // Create business card record
    let card_insert = serde_json::json!({
        "id": card_id,
        "user_id": user_id,
        "name": req.name,
        "title": req.title,
        "company": req.company,
        "email": req.email,
        "phone": req.phone,
        "website": req.website,
        "social_links": req.social_links.unwrap_or_else(|| serde_json::json!({})),
        "design_template": req.design_template.unwrap_or_else(|| "default".to_string()),
        "custom_fields": req.custom_fields.unwrap_or_else(|| serde_json::json!({})),
        "privacy_settings": req.privacy_settings.unwrap_or_else(|| serde_json::json!({
            "public": true,
            "show_email": true,
            "show_phone": true
        })),
        "share_url": share_url,
        "view_count": 0,
        "is_active": true,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let insert_result = client
        .from("business_cards")
        .insert(&card_insert)
        .execute()
        .await;

    match insert_result {
        Ok(_) => {
            // Generate QR code
            let qr_code_url = generate_qr_code(&share_url).await?;

            // Update card with QR code URL
            let qr_update = serde_json::json!({
                "qr_code_url": qr_code_url,
            });

            let _ = client
                .from("business_cards")
                .update(&qr_update)
                .eq("id", &card_id)
                .execute()
                .await;

            // Create NFT if enabled
            let mut nft_token_id = None;
            if req.nft_enabled.unwrap_or(false) {
                match create_business_card_nft(&client, &card_id, &user_id, &req).await {
                    Ok(token_id) => nft_token_id = Some(token_id),
                    Err(e) => eprintln!("Failed to create NFT: {}", e),
                }
            }

            // Log activity
            let _ = log_business_card_activity(&client, &card_id, &user_id, "created").await;

            Ok(CreateBusinessCardResponse {
                success: true,
                data: Some(BusinessCardData {
                    id: card_id,
                    name: req.name,
                    qr_code_url,
                    share_url,
                    nft_token_id,
                    created_at: chrono::Utc::now().to_rfc3339(),
                }),
                error: None,
            })
        },
        Err(e) => Ok(CreateBusinessCardResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create business card: {}", e)),
        })
    }
}

async fn generate_qr_code(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Generate QR code using external service or library
    // For now, return a placeholder URL
    Ok(format!("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={}", 
        urlencoding::encode(url)))
}

async fn create_business_card_nft(
    client: &supabase::Client,
    card_id: &str,
    user_id: &str,
    req: &CreateBusinessCardRequest,
) -> Result<String, Box<dyn std::error::Error>> {
    let token_id = Uuid::new_v4().to_string();

    // Create NFT metadata
    let nft_metadata = serde_json::json!({
        "name": format!("Business Card - {}", req.name),
        "description": format!("Digital business card NFT for {}", req.name),
        "image": format!("https://resendit.ai/api/cards/{}/image", card_id),
        "attributes": [
            {
                "trait_type": "Name",
                "value": req.name
            },
            {
                "trait_type": "Company",
                "value": req.company.as_ref().unwrap_or(&"".to_string())
            },
            {
                "trait_type": "Created",
                "value": chrono::Utc::now().format("%Y-%m-%d").to_string()
            }
        ]
    });

    // Store NFT record
    let nft_insert = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "token_id": token_id,
        "business_card_id": card_id,
        "user_id": user_id,
        "metadata": nft_metadata,
        "contract_address": std::env::var("NFT_CONTRACT_ADDRESS").unwrap_or_default(),
        "blockchain": "ethereum",
        "status": "pending",
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    client
        .from("business_card_nfts")
        .insert(&nft_insert)
        .execute()
        .await?;

    // Queue for blockchain minting (would integrate with actual blockchain service)
    let mint_queue = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "token_id": token_id,
        "user_id": user_id,
        "metadata": nft_metadata,
        "status": "queued",
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    client
        .from("nft_mint_queue")
        .insert(&mint_queue)
        .execute()
        .await?;

    Ok(token_id)
}

async fn log_business_card_activity(
    client: &supabase::Client,
    card_id: &str,
    user_id: &str,
    action: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let activity_log = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "business_card_id": card_id,
        "user_id": user_id,
        "action": action,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "metadata": serde_json::json!({}),
    });

    client
        .from("business_card_activities")
        .insert(&activity_log)
        .execute()
        .await?;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    Ok(supabase::Client::new(url, key))
}
