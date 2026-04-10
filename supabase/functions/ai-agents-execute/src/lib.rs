use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use std::time::Instant;

#[derive(Deserialize)]
pub struct ExecuteAgentRequest {
    pub prompt: String,
    pub context: Option<serde_json::Value>,
    pub stream: Option<bool>,
    pub max_tokens: Option<i32>,
    pub temperature: Option<f64>,
}

#[derive(Serialize)]
pub struct ExecuteAgentResponse {
    pub success: bool,
    pub data: Option<AgentExecutionData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct AgentExecutionData {
    pub response: String,
    pub usage: TokenUsage,
    pub execution_time_ms: u64,
    pub confidence_score: Option<f64>,
    pub sources: Option<Vec<String>>,
    pub metadata: serde_json::Value,
}

#[derive(Serialize)]
pub struct TokenUsage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
    pub total_tokens: i32,
}

pub async fn handle_execute_agent(
    agent_id: String,
    req: ExecuteAgentRequest,
    user_id: String,
) -> Result<ExecuteAgentResponse, Box<dyn std::error::Error>> {
    let start_time = Instant::now();
    
    if req.prompt.trim().is_empty() {
        return Ok(ExecuteAgentResponse {
            success: false,
            data: None,
            error: Some("Prompt is required".to_string()),
        });
    }

    let client = create_supabase_client()?;

    // Get agent configuration
    let agent_result = client
        .from("ai_agents")
        .select("*")
        .eq("id", &agent_id)
        .eq("user_id", &user_id)
        .single()
        .execute()
        .await;

    let agent_data = match agent_result {
        Ok(data) => data,
        Err(_) => return Ok(ExecuteAgentResponse {
            success: false,
            data: None,
            error: Some("Agent not found or access denied".to_string()),
        }),
    };

    // Check if agent is active
    let is_active = agent_data.get("is_active").and_then(|v| v.as_bool()).unwrap_or(false);
    if !is_active {
        return Ok(ExecuteAgentResponse {
            success: false,
            data: None,
            error: Some("Agent is not active".to_string()),
        });
    }

    // Extract agent configuration
    let system_prompt = agent_data.get("system_prompt").and_then(|v| v.as_str()).unwrap_or("");
    let model_id = agent_data.get("model_id").and_then(|v| v.as_str()).unwrap_or("gpt-4");
    let agent_temperature = agent_data.get("temperature").and_then(|v| v.as_f64()).unwrap_or(0.7);
    let agent_max_tokens = agent_data.get("max_tokens").and_then(|v| v.as_i64()).unwrap_or(2048) as i32;

    // Use request parameters or fall back to agent defaults
    let temperature = req.temperature.unwrap_or(agent_temperature);
    let max_tokens = req.max_tokens.unwrap_or(agent_max_tokens);

    // Get relevant context from user's data
    let context = get_agent_context(&client, &user_id, &req.prompt).await?;

    // Build the full prompt with context
    let full_prompt = build_contextual_prompt(system_prompt, &req.prompt, &context, req.context.as_ref());

    // Execute AI model
    let ai_response = execute_ai_model(model_id, &full_prompt, temperature, max_tokens).await?;

    let execution_time = start_time.elapsed().as_millis() as u64;

    // Update agent metrics
    let _ = update_agent_metrics(&client, &agent_id, execution_time, ai_response.success).await;

    // Log interaction
    let _ = log_agent_interaction(&client, &agent_id, &req.prompt, &ai_response.response, execution_time).await;

    Ok(ExecuteAgentResponse {
        success: true,
        data: Some(AgentExecutionData {
            response: ai_response.response,
            usage: ai_response.usage,
            execution_time_ms: execution_time,
            confidence_score: ai_response.confidence_score,
            sources: context.sources,
            metadata: serde_json::json!({
                "model": model_id,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "context_used": !context.data.is_empty(),
            }),
        }),
        error: None,
    })
}

#[derive(Debug)]
struct AgentContext {
    data: Vec<serde_json::Value>,
    sources: Option<Vec<String>>,
}

async fn get_agent_context(
    client: &supabase::Client,
    user_id: &str,
    prompt: &str,
) -> Result<AgentContext, Box<dyn std::error::Error>> {
    let mut context_data = Vec::new();
    let mut sources = Vec::new();

    // Search for relevant assets based on prompt keywords
    let asset_keywords = extract_keywords(prompt);
    if !asset_keywords.is_empty() {
        let assets_result = client
            .from("assets")
            .select("name, description, asset_type, specifications, current_value, status")
            .eq("user_id", user_id)
            .limit(5)
            .execute()
            .await;

        if let Ok(assets) = assets_result {
            if let Some(assets_array) = assets.as_array() {
                for asset in assets_array {
                    context_data.push(asset.clone());
                    if let Some(name) = asset.get("name").and_then(|v| v.as_str()) {
                        sources.push(format!("Asset: {}", name));
                    }
                }
            }
        }
    }

    // Get recent analytics if prompt mentions performance or metrics
    if prompt.to_lowercase().contains("performance") || prompt.to_lowercase().contains("metrics") {
        let analytics_result = client
            .from("asset_analytics")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at.desc")
            .limit(3)
            .execute()
            .await;

        if let Ok(analytics) = analytics_result {
            if let Some(analytics_array) = analytics.as_array() {
                for analytic in analytics_array {
                    context_data.push(analytic.clone());
                    sources.push("Analytics Data".to_string());
                }
            }
        }
    }

    Ok(AgentContext {
        data: context_data,
        sources: if sources.is_empty() { None } else { Some(sources) },
    })
}

fn extract_keywords(text: &str) -> Vec<String> {
    // Simple keyword extraction - in production, use more sophisticated NLP
    text.split_whitespace()
        .filter(|word| word.len() > 3)
        .map(|word| word.to_lowercase())
        .collect()
}

fn build_contextual_prompt(
    system_prompt: &str,
    user_prompt: &str,
    context: &AgentContext,
    additional_context: Option<&serde_json::Value>,
) -> String {
    let mut full_prompt = format!("{}\n\n", system_prompt);

    if !context.data.is_empty() {
        full_prompt.push_str("Relevant context from your data:\n");
        for (i, item) in context.data.iter().enumerate() {
            full_prompt.push_str(&format!("{}. {}\n", i + 1, serde_json::to_string_pretty(item).unwrap_or_default()));
        }
        full_prompt.push_str("\n");
    }

    if let Some(additional) = additional_context {
        full_prompt.push_str(&format!("Additional context: {}\n\n", serde_json::to_string_pretty(additional).unwrap_or_default()));
    }

    full_prompt.push_str(&format!("User question: {}", user_prompt));
    full_prompt
}

#[derive(Debug)]
struct AIResponse {
    response: String,
    usage: TokenUsage,
    success: bool,
    confidence_score: Option<f64>,
}

async fn execute_ai_model(
    model_id: &str,
    prompt: &str,
    temperature: f64,
    max_tokens: i32,
) -> Result<AIResponse, Box<dyn std::error::Error>> {
    // This would integrate with actual AI services (OpenAI, Anthropic, etc.)
    // For now, return a mock response
    Ok(AIResponse {
        response: format!("AI response for model {} with prompt: {}", model_id, &prompt[..50.min(prompt.len())]),
        usage: TokenUsage {
            prompt_tokens: prompt.len() as i32 / 4, // rough estimate
            completion_tokens: 150,
            total_tokens: (prompt.len() as i32 / 4) + 150,
        },
        success: true,
        confidence_score: Some(0.85),
    })
}

async fn update_agent_metrics(
    client: &supabase::Client,
    agent_id: &str,
    execution_time: u64,
    success: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let metrics_update = if success {
        serde_json::json!({
            "total_interactions": "total_interactions + 1",
            "successful_interactions": "successful_interactions + 1",
            "average_response_time": format!("(average_response_time * (total_interactions - 1) + {}) / total_interactions", execution_time),
            "last_interaction": chrono::Utc::now().to_rfc3339(),
            "updated_at": chrono::Utc::now().to_rfc3339(),
        })
    } else {
        serde_json::json!({
            "total_interactions": "total_interactions + 1",
            "failed_interactions": "failed_interactions + 1",
            "last_interaction": chrono::Utc::now().to_rfc3339(),
            "updated_at": chrono::Utc::now().to_rfc3339(),
        })
    };

    let _ = client
        .from("agent_metrics")
        .update(&metrics_update)
        .eq("agent_id", agent_id)
        .execute()
        .await;

    Ok(())
}

async fn log_agent_interaction(
    client: &supabase::Client,
    agent_id: &str,
    prompt: &str,
    response: &str,
    execution_time: u64,
) -> Result<(), Box<dyn std::error::Error>> {
    let interaction_log = serde_json::json!({
        "id": uuid::Uuid::new_v4().to_string(),
        "agent_id": agent_id,
        "prompt": prompt,
        "response": response,
        "execution_time_ms": execution_time,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "metadata": serde_json::json!({
            "prompt_length": prompt.len(),
            "response_length": response.len(),
        }),
    });

    let _ = client
        .from("agent_interactions")
        .insert(&interaction_log)
        .execute()
        .await;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
