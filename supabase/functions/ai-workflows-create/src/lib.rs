use serde::{Deserialize, Serialize};
use supabase_wrappers::prelude::*;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
    pub steps: Vec<WorkflowStep>,
    pub trigger_type: Option<String>,
    pub trigger_config: Option<serde_json::Value>,
    pub is_active: Option<bool>,
}

#[derive(Deserialize, Serialize)]
pub struct WorkflowStep {
    pub name: String,
    pub step_type: String,
    pub configuration: serde_json::Value,
    pub order: i32,
    pub conditions: Option<serde_json::Value>,
}

#[derive(Serialize)]
pub struct CreateWorkflowResponse {
    pub success: bool,
    pub data: Option<WorkflowData>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct WorkflowData {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub steps_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn handle_create_workflow(
    req: CreateWorkflowRequest,
    user_id: String,
) -> Result<CreateWorkflowResponse, Box<dyn std::error::Error>> {
    // Validate required fields
    if req.name.trim().is_empty() {
        return Ok(CreateWorkflowResponse {
            success: false,
            data: None,
            error: Some("Workflow name is required".to_string()),
        });
    }

    if req.steps.is_empty() {
        return Ok(CreateWorkflowResponse {
            success: false,
            data: None,
            error: Some("At least one workflow step is required".to_string()),
        });
    }

    // Validate steps
    let validation_result = validate_workflow_steps(&req.steps);
    if let Err(error) = validation_result {
        return Ok(CreateWorkflowResponse {
            success: false,
            data: None,
            error: Some(error),
        });
    }

    let client = create_supabase_client()?;

    // Check user's workflow limit
    let workflow_count = get_user_workflow_count(&client, &user_id).await?;
    let max_workflows = get_user_workflow_limit(&client, &user_id).await?;
    
    if workflow_count >= max_workflows {
        return Ok(CreateWorkflowResponse {
            success: false,
            data: None,
            error: Some(format!("Workflow limit reached. Maximum {} workflows allowed", max_workflows)),
        });
    }

    // Validate trigger configuration
    let trigger_type = req.trigger_type.unwrap_or_else(|| "manual".to_string());
    if !is_valid_trigger_type(&trigger_type) {
        return Ok(CreateWorkflowResponse {
            success: false,
            data: None,
            error: Some("Invalid trigger type".to_string()),
        });
    }

    let workflow_id = Uuid::new_v4().to_string();

    // Create workflow record
    let workflow_insert = serde_json::json!({
        "id": workflow_id,
        "name": req.name,
        "description": req.description,
        "trigger_type": trigger_type,
        "trigger_config": req.trigger_config.unwrap_or_else(|| serde_json::json!({})),
        "is_active": req.is_active.unwrap_or(false),
        "status": "draft",
        "user_id": user_id,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let workflow_result = client
        .from("ai_workflows")
        .insert(&workflow_insert)
        .select("id, name, description, status, created_at, updated_at")
        .single()
        .execute()
        .await;

    match workflow_result {
        Ok(workflow_data) => {
            // Create workflow steps
            let steps_result = create_workflow_steps(&client, &workflow_id, &req.steps).await;
            
            match steps_result {
                Ok(steps_count) => {
                    let workflow: WorkflowData = serde_json::from_value(workflow_data)?;
                    
                    // Initialize workflow metrics
                    let _ = initialize_workflow_metrics(&client, &workflow_id).await;

                    Ok(CreateWorkflowResponse {
                        success: true,
                        data: Some(WorkflowData {
                            steps_count,
                            ..workflow
                        }),
                        error: None,
                    })
                },
                Err(e) => {
                    // Cleanup workflow if steps creation failed
                    let _ = client
                        .from("ai_workflows")
                        .delete()
                        .eq("id", &workflow_id)
                        .execute()
                        .await;

                    Ok(CreateWorkflowResponse {
                        success: false,
                        data: None,
                        error: Some(format!("Failed to create workflow steps: {}", e)),
                    })
                }
            }
        },
        Err(e) => Ok(CreateWorkflowResponse {
            success: false,
            data: None,
            error: Some(format!("Failed to create workflow: {}", e)),
        }),
    }
}

fn validate_workflow_steps(steps: &[WorkflowStep]) -> Result<(), String> {
    let valid_step_types = [
        "ai_analysis", "data_fetch", "condition", "notification", 
        "api_call", "data_transform", "asset_update", "report_generate"
    ];

    for (index, step) in steps.iter().enumerate() {
        if step.name.trim().is_empty() {
            return Err(format!("Step {} name is required", index + 1));
        }

        if !valid_step_types.contains(&step.step_type.as_str()) {
            return Err(format!("Invalid step type '{}' in step {}", step.step_type, index + 1));
        }

        if step.order < 0 {
            return Err(format!("Step {} order must be non-negative", index + 1));
        }
    }

    // Check for duplicate orders
    let mut orders: Vec<i32> = steps.iter().map(|s| s.order).collect();
    orders.sort();
    for i in 1..orders.len() {
        if orders[i] == orders[i-1] {
            return Err("Duplicate step orders are not allowed".to_string());
        }
    }

    Ok(())
}

async fn create_workflow_steps(
    client: &supabase::Client,
    workflow_id: &str,
    steps: &[WorkflowStep],
) -> Result<i32, Box<dyn std::error::Error>> {
    let mut step_inserts = Vec::new();

    for step in steps {
        let step_insert = serde_json::json!({
            "id": Uuid::new_v4().to_string(),
            "workflow_id": workflow_id,
            "name": step.name,
            "step_type": step.step_type,
            "configuration": step.configuration,
            "order": step.order,
            "conditions": step.conditions.clone().unwrap_or_else(|| serde_json::json!({})),
            "is_active": true,
            "created_at": chrono::Utc::now().to_rfc3339(),
        });
        step_inserts.push(step_insert);
    }

    let result = client
        .from("workflow_steps")
        .insert(&serde_json::Value::Array(step_inserts))
        .execute()
        .await?;

    Ok(steps.len() as i32)
}

async fn get_user_workflow_count(
    client: &supabase::Client,
    user_id: &str,
) -> Result<i32, Box<dyn std::error::Error>> {
    let result = client
        .from("ai_workflows")
        .select("count")
        .eq("user_id", user_id)
        .neq("status", "deleted")
        .single()
        .execute()
        .await?;

    Ok(result.get("count").and_then(|v| v.as_i64()).unwrap_or(0) as i32)
}

async fn get_user_workflow_limit(
    client: &supabase::Client,
    user_id: &str,
) -> Result<i32, Box<dyn std::error::Error>> {
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
                "enterprise" => 100,
                "professional" => 25,
                "starter" => 5,
                _ => 2, // free plan
            })
        },
        Err(_) => Ok(2), // default to free plan limit
    }
}

async fn initialize_workflow_metrics(
    client: &supabase::Client,
    workflow_id: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let metrics = serde_json::json!({
        "id": Uuid::new_v4().to_string(),
        "workflow_id": workflow_id,
        "total_executions": 0,
        "successful_executions": 0,
        "failed_executions": 0,
        "average_execution_time": 0.0,
        "last_execution": null,
        "created_at": chrono::Utc::now().to_rfc3339(),
        "updated_at": chrono::Utc::now().to_rfc3339(),
    });

    let _ = client
        .from("workflow_metrics")
        .insert(&metrics)
        .execute()
        .await;

    Ok(())
}

fn is_valid_trigger_type(trigger_type: &str) -> bool {
    let valid_triggers = ["manual", "schedule", "event", "threshold", "webhook"];
    valid_triggers.contains(&trigger_type)
}

fn create_supabase_client() -> Result<supabase::Client, Box<dyn std::error::Error>> {
    let url = std::env::var("SUPABASE_URL")?;
    let key = std::env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    Ok(supabase::Client::new(url, key))
}
