use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateAgentRequest {
    pub name: String,
    pub description: Option<String>,
    pub system_prompt: Option<String>,
    pub model_id: Option<String>,
    pub parameters: Option<serde_json::Value>,
    pub tools: Option<serde_json::Value>,
    pub max_tokens: Option<i32>,
    pub temperature: Option<f64>,
    pub is_active: Option<bool>,
}

#[derive(Serialize)]
pub struct CreateAgentResponse {
    pub success: bool,
    pub data: Option<AgentData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct AgentData {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub model_id: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn handle_create_agent(
    req: CreateAgentRequest,
    user_id: String,
) -> Result<CreateAgentResponse, Box<dyn std::error::Error>> {
    // Validate required fields
    if req.name.trim().is_empty() {
        return Ok(CreateAgentResponse {
            success: false,
            data: None,
            error: Some("Agent name is required".to_string()),
        });
    }

    // Validate model_id
    let model_id = req.model_id.unwrap_or_else(|| "gpt-4".to_string());
    if !is_valid_model(&model_id) {
        return Ok(CreateAgentResponse {
            success: false,
            data: None,
            error: Some("Invalid model ID".to_string()),
        });
    }

    // Validate temperature
    if let Some(temp) = req.temperature {
        if temp < 0.0 || temp > 2.0 {
            return Ok(CreateAgentResponse {
                success: false,
                data: None,
                error: Some("Temperature must be between 0.0 and 2.0".to_string()),
            });
        }
    }

    let client = create_supabase_client()?;

    // Check user's agent limit
    let agent_count = get_user_agent_count(&client, &user_id).await?;
    let max_agents = get_user_agent_limit(&client, &user_id).await?;
    
    if agent_count >= max_agents {
        return Ok(CreateAgentResponse {
            success: false,
            data: None,
            error: Some(format!("Agent limit reached. Maximum {} agents allowed", max_agents)),
        });
    }

    // Create default system prompt if not provided
    let system_prompt = req.system_prompt.unwrap_or_else(|| {
        format!("You are {}, an AI assistant specialized in asset management and business intelligence. You help users analyze data, make predictions, and optimize operations.", req.name)
    });

    // Create agent record
    let agent_insert = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "name": req.name,
        "description": req.description,
        "system_prompt": system_prompt,
        "model_id": model_id,
        "parameters": req.parameters.unwrap_or_else(|| serde_json::json!({})),
        "tools": req.tools.unwrap_or_else(|| serde_json::json!([])),
        "max_tokens": req.max_tokens.unwrap_or(2048),
        "temperature": req.temperature.unwrap_or(0.7),
        "is_active": req.is_active.unwrap_or(true),
        "status": "inactive",
        "user_id": user_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let result = client
        .from("ai_agents")
        .insert(&agent_insert)
        .select("id, name, description, model_id, status, created_at, updated_at")
        .single()
        .execute()
        .await;

    match result {
        Ok(agent_data) => {
            let agent: AgentData = serde_json::from_value(agent_data)?;
            
            // Initialize agent metrics
            let _ = initialize_agent_metrics(&client, &agent.id).await;
            
            // Create initial training data if needed
            let _ = setup_agent_training(&client, &agent.id, &user_id).await;

            Ok(CreateAgentResponse {
                success: true,
                data: Some(agent),
                error: None,
            })
        },
        Err(e) => Ok(CreateAgentResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create agent: {}", e)),
        }),
    }
}

async fn get_user_agent_count(
    client: &supabase::Client,
    user_id: &str,
) -> Result<i32, Box<dyn std::error::Error>> {
    let result = client
        .from("ai_agents")
        .select("count")
        .eq("user_id", user_id)
        .neq("status", "deleted")
        .single()
        .execute()
        .await?;

    Ok(result.get("count").and_then(|v| v.as_i64()).unwrap_or(0) as i32)
}

async fn get_user_agent_limit(
    client: &supabase::Client,
    user_id: &str,
) -> Result<i32, Box<dyn std::error::Error>> {
    // Check user's subscription plan for agent limits
    let result = client
        .from("profiles")
        .select("subscription_plan")
        .eq("id", user_id)
        .single()
        .execute()
        .await;

    match result {
        Ok(profile) => {
            let plan = profile.get("subscription_plan").and_then(|v| v.as_str()).unwrap_or("free");
            Ok(match plan {
                "enterprise" => 50,
                "professional" => 10,
                "starter" => 3,
                _ => 1, // free plan
            })
        },
        Err(_) => Ok(1), // default to free plan limit
    }
}

async fn initialize_agent_metrics(
    client: &supabase::Client,
    agent_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let metrics = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "agent_id": agent_id,
        "total_interactions": 0,
        "successful_interactions": 0,
        "failed_interactions": 0,
        "average_response_time": 0.0,
        "accuracy_score": 0.0,
        "last_interaction": null,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("agent_metrics")
        .insert(&metrics)
        .execute()
        .await;

    Ok(())
}

async fn setup_agent_training(
    client: &supabase::Client,
    agent_id: &str,
    user_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Create training dataset based on user's existing assets
    let assets = client
        .from("assets")
        .select("name, description, asset_type, specifications")
        .eq("user_id", user_id)
        .limit(100)
        .execute()
        .await;

    if let Ok(asset_data) = assets {
        let training_data = serde_json::json!({
            "id": Uuid::new_v4().to_string(),
            "agent_id": agent_id,
            "training_type": "asset_knowledge",
            "data": asset_data,
            "status": "pending",
            "created_at": chrono::Utc::now().to_rfc3339(),
        });

        let _ = client
            .from("agent_training_data")
            .insert(&training_data)
            .execute()
            .await;
    }

    Ok(())
}

fn is_valid_model(model_id: &str) -> bool {
    let valid_models = [
        "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo",
        "claude-3-opus", "claude-3-sonnet", "claude-3-haiku",
        "gemini-pro", "gemini-pro-vision",
        "llama-2-70b", "llama-2-13b", "llama-2-7b",
    ];
    valid_models.contains(&model_id)
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
