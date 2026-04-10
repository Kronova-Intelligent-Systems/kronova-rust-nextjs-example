use serde::{Deserialize, Serialize};
use super::{ApiResponse, KronovaClient};
use std::error::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct PlaidAccount {
    pub account_id: String,
    pub name: String,
    pub official_name: Option<String>,
    pub mask: Option<String>,
    pub account_type: String,
    pub account_subtype: Option<String>,
    pub current_balance: f64,
    pub available_balance: Option<f64>,
    pub currency_code: String,
    pub credit_limit: Option<f64>,
    pub institution_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlaidTransaction {
    pub transaction_id: String,
    pub account_id: String,
    pub amount: f64,
    pub date: String,
    pub name: String,
    pub merchant_name: Option<String>,
    pub category: Vec<String>,
    pub pending: bool,
}

#[derive(Debug, Serialize)]
pub struct GetAccountsRequest {
    pub item_id: String,
}

#[derive(Debug, Serialize)]
pub struct GetTransactionsRequest {
    pub item_id: String,
    pub start_date: String,
    pub end_date: String,
}

impl KronovaClient {
    pub async fn get_plaid_accounts(&self, item_id: &str) -> Result<ApiResponse<Vec<PlaidAccount>>, Box<dyn Error>> {
        self.invoke_function("plaid-accounts", &GetAccountsRequest {
            item_id: item_id.to_string(),
        }).await
    }

    pub async fn get_plaid_transactions(
        &self,
        item_id: &str,
        start_date: &str,
        end_date: &str,
    ) -> Result<ApiResponse<Vec<PlaidTransaction>>, Box<dyn Error>> {
        self.invoke_function("plaid-transactions", &GetTransactionsRequest {
            item_id: item_id.to_string(),
            start_date: start_date.to_string(),
            end_date: end_date.to_string(),
        }).await
    }
}
