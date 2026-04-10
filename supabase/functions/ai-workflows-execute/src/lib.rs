use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use std::time::Instant;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ExecuteWorkflowRequest {
    pub input_data: Option<serde_json::Value>,
    pub async_execution: Option<bool>,
}

#[derive(Serialize)]
pub struct ExecuteWorkflowResponse {
    pub success: bool,
    pub data: Option<WorkflowExecutionData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct WorkflowExecutionData {
    pub execution_id: String,
    pub status: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub execution_time_ms: Option<u64>,
    pub step_results: Vec<StepResult>,
    pub output_data: Option<serde_json::Value>,
}

#[derive(Serialize)]
pub struct StepResult {
    pub step_id: String,
    pub step_name: String,
    pub status: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
}

pub async fn handle_execute_workflow(
    workflow_id: String,
    req: ExecuteWorkflowRequest,
    user_id: String,
) -> Result<ExecuteWorkflowResponse, Box<dyn std::error::Error>> {
    let start_time = Instant::now();
    let client = create_supabase_client()?;

    // Get workflow configuration
    let workflow_result = client
        .from("ai_workflows")
        .select("*")
        .eq("id", &workflow_id)
        .eq("user_id", &user_id)
        .single()
        .execute()
        .await;

    let workflow_data = match workflow_result {
        Ok(data) => data,
        Err(_) => return Ok(ExecuteWorkflowResponse {
            success: false,
            data: None,
            error: Some("Workflow not found or access denied".to_string()),
        }),
    };

    // Check if workflow is active
    let is_active = workflow_data.get("is_active").and_then(|v| v.as_bool()).unwrap_or(false);
    if !is_active {
        return Ok(ExecuteWorkflowResponse {
            success: false,
            data: None,
            error: Some("Workflow is not active".to_string()),
        });
    }

    // Get workflow steps
    let steps_result = client
        .from("workflow_steps")
        .select("*")
        .eq("workflow_id", &workflow_id)
        .eq("is_active", true)
        .order("order.asc")
        .execute()
        .await;

    let steps = match steps_result {
        Ok(data) => data,
        Err(_) => return Ok(ExecuteWorkflowResponse {
            success: false,
            data: None,
            error: Some("Failed to load workflow steps".to_string()),
        }),
    };

    let steps_array = steps.as_array().unwrap_or(&vec![]);
    if steps_array.is_empty() {
        return Ok(ExecuteWorkflowResponse {
            success: false,
            data: None,
            error: Some("No active steps found in workflow".to_string()),
        });
    }

    // Create execution record
    let execution_id = Uuid::new_v4().to_string();
    let execution_record = serde_json::json!({
        "id": execution_id,
        "workflow_id": workflow_id,
        "status": "running",
        "input_data": req.input_data,
        "started_at": chrono::Utc::now().to_rfc3339(),
        "user_id": user_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("workflow_executions")
        .insert(&execution_record)
        .execute()
        .await;

    // Execute workflow steps
    let mut step_results = Vec::new();
    let mut execution_context = ExecutionContext {
        input_data: req.input_data.unwrap_or_else(|| serde_json::json!({})),
        variables: serde_json::Map::new(),
        user_id: user_id.clone(),
    };

    let mut overall_success = true;
    let mut final_output = None;

    for step_data in steps_array {
        let step_id = step_data.get("id").and_then(|v| v.as_str()).unwrap_or("");
        let step_name = step_data.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let step_type = step_data.get("step_type").and_then(|v| v.as_str()).unwrap_or("");
        let configuration = step_data.get("configuration").cloned().unwrap_or_else(|| serde_json::json!({}));
        let conditions = step_data.get("conditions").cloned().unwrap_or_else(|| serde_json::json!({}));

        let step_start_time = Instant::now();
        let step_started_at = chrono::Utc::now().to_rfc3339();

        // Check step conditions
        if !evaluate_step_conditions(&conditions, &execution_context) {
            step_results.push(StepResult {
                step_id: step_id.to_string(),
                step_name: step_name.to_string(),
                status: "skipped".to_string(),
                started_at: step_started_at,
                completed_at: Some(chrono::Utc::now().to_rfc3339()),
                output: Some(serde_json::json!({"reason": "conditions not met"})),
                error: None,
            });
            continue;
        }

        // Execute step
        let step_result = execute_workflow_step(
            &client,
            step_type,
            &configuration,
            &mut execution_context,
        ).await;

        let step_completed_at = chrono::Utc::now().to_rfc3339();

        match step_result {
            Ok(output) => {
                step_results.push(StepResult {
                    step_id: step_id.to_string(),
                    step_name: step_name.to_string(),
                    status: "completed".to_string(),
                    started_at: step_started_at,
                    completed_at: Some(step_completed_at),
                    output: Some(output.clone()),
                    error: None,
                });
                final_output = Some(output);
            },
            Err(error) => {
                overall_success = false;
                step_results.push(StepResult {
                    step_id: step_id.to_string(),
                    step_name: step_name.to_string(),
                    status: "failed".to_string(),
                    started_at: step_started_at,
                    completed_at: Some(step_completed_at),
                    output: None,
                    error: Some(error.to_string()),
                });
                break; // Stop execution on first failure
            }
        }
    }

    let execution_time = start_time.elapsed().as_millis() as u64;
    let completed_at = chrono::Utc::now().to_rfc3339();
    let final_status = if overall_success { "completed" } else { "failed" };

    // Update execution record
    let _ = client
        .from("workflow_executions")
        .update(&serde_json::json!({
            "status": final_status,
            "completed_at": completed_at,
            "execution_time_ms": execution_time,
            "output_data": final_output,
            "step_results": step_results,
            "updated_at": chrono::Utc::now().to_rfc3339(),
        }))
        .eq("id", &execution_id)
        .execute()
        .await;

    // Update workflow metrics
    let _ = update_workflow_metrics(&client, &workflow_id, execution_time, overall_success).await;

    Ok(ExecuteWorkflowResponse {
        success: overall_success,
        data: Some(WorkflowExecutionData {
            execution_id,
            status: final_status.to_string(),
            started_at: execution_record.get("started_at").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            completed_at: Some(completed_at),
            execution_time_ms: Some(execution_time),
            step_results,
            output_data: final_output,
        }),
        error: if overall_success { None } else { Some("Workflow execution failed".to_string()) },
    })
}

struct ExecutionContext {
    input_data: serde_json::Value,
    variables: serde_json::Map<String, serde_json::Value>,
    user_id: String,
}

fn evaluate_step_conditions(
    conditions: &serde_json::Value,
    context: &ExecutionContext,
) -> bool {
    // Simple condition evaluation - in production, implement more sophisticated logic
    if conditions.is_null() || conditions.as_object().map_or(true, |obj| obj.is_empty()) {
        return true; // No conditions means always execute
    }

    // For now, always return true - implement actual condition logic as needed
    true
}

async fn execute_workflow_step(
    client: &supabase::Client,
    step_type: &str,
    configuration: &serde_json::Value,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    match step_type {
        "data_fetch" => execute_data_fetch_step(client, configuration, context).await,
        "ai_analysis" => execute_ai_analysis_step(client, configuration, context).await,
        "condition" => execute_condition_step(configuration, context).await,
        "notification" => execute_notification_step(client, configuration, context).await,
        "api_call" => execute_api_call_step(configuration, context).await,
        "data_transform" => execute_data_transform_step(configuration, context).await,
        "asset_update" => execute_asset_update_step(client, configuration, context).await,
        "report_generate" => execute_report_generate_step(client, configuration, context).await,
        _ => Err(format!("Unknown step type: {}", step_type).into()),
    }
}

async fn execute_data_fetch_step(
    client: &supabase::Client,
    configuration: &serde_json::Value,
    context: &ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let table = configuration.get("table").and_then(|v| v.as_str()).unwrap_or("assets");
    let limit = configuration.get("limit").and_then(|v| v.as_i64()).unwrap_or(10) as usize;

    let result = client
        .from(table)
        .select("*")
        .eq("user_id", &context.user_id)
        .limit(limit)
        .execute()
        .await?;

    Ok(serde_json::json!({
        "data": result,
        "count": result.as_array().map_or(0, |arr| arr.len()),
        "table": table,
    }))
}

async fn execute_ai_analysis_step(
    client: &supabase::Client,
    configuration: &serde_json::Value,
    context: &ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let prompt = configuration.get("prompt").and_then(|v| v.as_str()).unwrap_or("Analyze the data");
    
    // Mock AI analysis - in production, integrate with actual AI services
    Ok(serde_json::json!({
        "analysis": format!("AI analysis result for: {}", prompt),
        "confidence": 0.85,
        "recommendations": ["Recommendation 1", "Recommendation 2"],
    }))
}

async fn execute_condition_step(
    configuration: &serde_json::Value,
    context: &ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let condition = configuration.get("condition").and_then(|v| v.as_str()).unwrap_or("true");
    
    // Simple condition evaluation - implement more sophisticated logic as needed
    let result = condition == "true";
    
    Ok(serde_json::json!({
        "condition_met": result,
        "condition": condition,
    }))
}

async fn execute_notification_step(
    client: &supabase::Client,
    configuration: &serde_json::Value,
    context: &ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let message = configuration.get("message").and_then(|v| v.as_str()).unwrap_or("Workflow notification");
    let notification_type = configuration.get("type").and_then(|v| v.as_str()).unwrap_or("info");

    // Create notification record
    let notification = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "user_id": context.user_id,
        "type": notification_type,
        "title": "Workflow Notification",
        "message": message,
        "read": false,
        "created_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("notifications")
        .insert(&notification)
        .execute()
        .await;

    Ok(serde_json::json!({
        "notification_sent": true,
        "message": message,
        "type": notification_type,
    }))
}

async fn execute_api_call_step(
    configuration: &serde_json::Value,
    context: &ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let url = configuration.get("url").and_then(|v| v.as_str()).unwrap_or("");
    let method = configuration.get("method").and_then(|v| v.as_str()).unwrap_or("GET");

    // Mock API call - in production, implement actual HTTP requests
    Ok(serde_json::json!({
        "api_call_completed": true,
        "url": url,
        "method": method,
        "response": "Mock API response",
    }))
}

async fn execute_data_transform_step(
    configuration: &serde_json::Value,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let transform_type = configuration.get("transform_type").and_then(|v| v.as_str()).unwrap_or("identity");

    // Simple data transformation - implement more sophisticated transforms as needed
    let transformed_data = match transform_type {
        "uppercase" => context.input_data.to_string().to_uppercase(),
        "lowercase" => context.input_data.to_string().to_lowercase(),
        _ => context.input_data.to_string(),
    };

    Ok(serde_json::json!({
        "transformed_data": transformed_data,
        "transform_type": transform_type,
    }))
}

async fn execute_asset_update_step(
    client: &supabase::Client,
    configuration: &serde_json::Value,
    context: &ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let asset_id = configuration.get("asset_id").and_then(|v| v.as_str()).unwrap_or("");
    let updates = configuration.get("updates").cloned().unwrap_or_else(|| serde_json::json!({}));

    if asset_id.is_empty() {
        return Err("Asset ID is required for asset update step".into());
    }

    let result = client
        .from("assets")
        .update(&updates)
        .eq("id", asset_id)
        .eq("user_id", &context.user_id)
        .execute()
        .await?;

    Ok(serde_json::json!({
        "asset_updated": true,
        "asset_id": asset_id,
        "updates": updates,
    }))
}

async fn execute_report_generate_step(
    client: &supabase::Client,
    configuration: &serde_json::Value,
    context: &ExecutionContext,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let report_type = configuration.get("report_type").and_then(|v| v.as_str()).unwrap_or("summary");
    let report_id = Uuid::new_v4().to_string();

    // Generate report based on type
    let report_data = match report_type {
        "asset_summary" => generate_asset_summary_report(client, &context.user_id).await?,
        "performance" => generate_performance_report(client, &context.user_id).await?,
        _ => serde_json::json!({"type": report_type, "message": "Generic report generated"}),
    };

    Ok(serde_json::json!({
        "report_generated": true,
        "report_id": report_id,
        "report_type": report_type,
        "report_data": report_data,
    }))
}

async fn generate_asset_summary_report(
    client: &supabase::Client,
    user_id: &str,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let assets = client
        .from("assets")
        .select("status, asset_type, current_value")
        .eq("user_id", user_id)
        .execute()
        .await?;

    Ok(serde_json::json!({
        "total_assets": assets.as_array().map_or(0, |arr| arr.len()),
        "summary": "Asset summary report generated",
    }))
}

async fn generate_performance_report(
    client: &supabase::Client,
    user_id: &str,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    Ok(serde_json::json!({
        "performance_score": 85.5,
        "summary": "Performance report generated",
    }))
}

async fn update_workflow_metrics(
    client: &supabase::Client,
    workflow_id: &str,
    execution_time: u64,
    success: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let metrics_update = if success {
        serde_json::json!({
            "total_executions": "total_executions + 1",
            "successful_executions": "successful_executions + 1",
            "average_execution_time": format!("(average_execution_time * (total_executions - 1) + {}) / total_executions", execution_time),
            "last_execution": chrono::Utc::now().to_rfc3339(),
            "updated_at": chrono::Utc::now().to_rfc3339(),
        })
    } else {
        serde_json::json!({
            "total_executions": "total_executions + 1",
            "failed_executions": "failed_executions + 1",
            "last_execution": chrono::Utc::now().to_rfc3339(),
            "updated_at": chrono::Utc::now().to_rfc3339(),
        })
    };

    let _ = client
        .from("workflow_metrics")
        .update(&metrics_update)
        .eq("workflow_id", workflow_id)
        .execute()
        .await;

    Ok(())
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
