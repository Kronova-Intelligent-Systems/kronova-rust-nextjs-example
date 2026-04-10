use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct MintNFTRequest {
    pub asset_id: Option<String>,
    pub business_card_id: Option<String>,
    pub metadata: serde_json::Value,
    pub recipient_address: String,
    pub blockchain: Option<String>,
}

#[derive(Serialize)]
pub struct MintNFTResponse {
    pub success: bool,
    pub data: Option<NFTData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct NFTData {
    pub token_id: String,
    pub contract_address: String,
    pub transaction_hash: Option<String>,
    pub blockchain: String,
    pub status: String,
    pub metadata_uri: String,
}

pub async fn handle_mint_nft(
    req: MintNFTRequest,
    user_id: String,
) -> Result<MintNFTResponse, Box<dyn std::error::Error>> {
    let client = create_supabase_client()?;

    // Validate request
    if req.asset_id.is_none() && req.business_card_id.is_none() {
        return Ok(MintNFTResponse {
            success: false,
            data: None,
            error: Some("Either asset_id or business_card_id is required".to_string()),
        });
    }

    if !is_valid_ethereum_address(&req.recipient_address) {
        return Ok(MintNFTResponse {
            success: false,
            data: None,
            error: Some("Invalid recipient address".to_string()),
        });
    }

    let blockchain = req.blockchain.unwrap_or_else(|| "ethereum".to_string());
    let token_id = Uuid::new_v4().to_string();
    let contract_address = get_contract_address(&blockchain)?;

    // Upload metadata to IPFS
    let metadata_uri = upload_metadata_to_ipfs(&req.metadata).await?;

    // Create NFT record
    let nft_insert = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "token_id": token_id,
        "asset_id": req.asset_id,
        "business_card_id": req.business_card_id,
        "user_id": user_id,
        "recipient_address": req.recipient_address,
        "contract_address": contract_address,
        "blockchain": blockchain,
        "metadata": req.metadata,
        "metadata_uri": metadata_uri,
        "status": "pending",
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    let insert_result = client
        .from("nfts")
        .insert(&nft_insert)
        .execute()
        .await;

    match insert_result {
        Ok(_) => {
            // Queue for blockchain minting
            let mint_job = serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "token_id": token_id,
                "recipient_address": req.recipient_address,
                "contract_address": contract_address,
                "metadata_uri": metadata_uri,
                "blockchain": blockchain,
                "status": "queued",
                "created_at": chrono::Utc::now().to_rfc3339(),
            });

            client
                .from("nft_mint_queue")
                .insert(&mint_job)
                .execute()
                .await?;

            // Simulate blockchain interaction (in production, this would be actual blockchain calls)
            let transaction_hash = simulate_blockchain_mint(&token_id, &req.recipient_address).await?;

            // Update NFT with transaction hash
            let update_data = serde_json::json!({
                "transaction_hash": transaction_hash,
                "status": "minting",
                "updated_at": chrono::Utc::now().to_rfc3339(),
            });

            client
                .from("nfts")
                .update(&update_data)
                .eq("token_id", &token_id)
                .execute()
                .await?;

            // Log NFT activity
            let _ = log_nft_activity(&client, &token_id, &user_id, "mint_initiated").await;

            Ok(MintNFTResponse {
                success: true,
                data: Some(NFTData {
                    token_id,
                    contract_address,
                    transaction_hash: Some(transaction_hash),
                    blockchain,
                    status: "minting".to_string(),
                    metadata_uri,
                }),
                error: None,
            })
        },
        Err(e) => Ok(MintNFTResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create NFT record: {}", e)),
        })
    }
}

fn get_contract_address(blockchain: &str) -> Result<String, Box<dyn std::error::Error>> {
    match blockchain {
        "ethereum" => Ok(std::env::var("ETHEREUM_NFT_CONTRACT").unwrap_or_default()),
        "polygon" => Ok(std::env::var("POLYGON_NFT_CONTRACT").unwrap_or_default()),
        "bsc" => Ok(std::env::var("BSC_NFT_CONTRACT").unwrap_or_default()),
        _ => Err("Unsupported blockchain".into()),
    }
}

async fn upload_metadata_to_ipfs(metadata: &serde_json::Value) -> Result<String, Box<dyn std::error::Error>> {
    // In production, this would upload to IPFS
    // For now, return a mock IPFS hash
    let hash = format!("Qm{}", Uuid::new_v4().to_string().replace("-", ""));
    Ok(format!("ipfs://{}", hash))
}

async fn simulate_blockchain_mint(token_id: &str, recipient: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Simulate blockchain transaction
    // In production, this would interact with actual blockchain
    let tx_hash = format!("0x{}", Uuid::new_v4().to_string().replace("-", ""));
    Ok(tx_hash)
}

fn is_valid_ethereum_address(address: &str) -> bool {
    address.starts_with("0x") && address.len() == 42 && address[2..].chars().all(|c| c.is_ascii_hexdigit())
}

async fn log_nft_activity(
    client: &supabase::Client,
    token_id: &str,
    user_id: &str,
    action: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let activity_log = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "token_id": token_id,
        "user_id": user_id,
        "action": action,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "metadata": serde_json::json!({}),
    });

    client
        .from("nft_activities")
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
