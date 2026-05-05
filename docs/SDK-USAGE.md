# Kronova SDK Documentation

## Overview

The Kronova SDK provides enterprise-grade access to the platform's Rust serverless functions through both Rust and TypeScript interfaces.

## Architecture

### Rust SDK (`lib/rust-sdk`)

The Rust SDK provides direct access to Supabase Edge Functions written in Rust. It offers:

- Type-safe function invocations
- Automatic serialization/deserialization
- Error handling and retries
- Connection pooling

**Example Usage:**

```rust
use kronova_intelligent_systems_sdk::{KronovaClient, assets::CreateAssetRequest};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = KronovaClient::new(
        "https://your-project.supabase.co".to_string(),
        "your-service-role-key".to_string(),
    );

    // Create an asset
    let asset = client.create_asset(CreateAssetRequest {
        asset_id: "ASSET-001".to_string(),
        name: "Company Vehicle".to_string(),
        asset_type: "vehicle".to_string(),
        category: Some("transportation".to_string()),
        description: Some("2024 Tesla Model 3".to_string()),
        purchase_cost: Some(45000.0),
        current_value: Some(42000.0),
        status: "active".to_string(),
    }).await?;

    println!("Created asset: {:?}", asset);

    // List all assets
    let assets = client.list_assets().await?;
    println!("Total assets: {}", assets.data.unwrap().len());

    Ok(())
}
```

### TypeScript SDK (`lib/rspc-sdk`)

The TypeScript SDK wraps rspc calls with a clean, Promise-based API:

```typescript
import { sdk } from '@kronova-intelligent-systems/rspc-sdk'

// Create an asset
const asset = await sdk.createAsset({  
  asset_id: 'ASSET-001',
  name: 'Company Vehicle',
  asset_type: 'vehicle',
  status: 'active',
  current_value: 42000
})

// Get Plaid accounts
const accounts = await sdk.getPlaidAccounts('item_12345')
console.log(`Found ${accounts.length} bank accounts`)

// Execute AI agent
const result = await sdk.executeAgent('agent_abc', {
  prompt: 'Analyze asset depreciation trends',
  context: { asset_ids: ['ASSET-001', 'ASSET-002'] }
})
```

## Plaid Integration

### Supported Account Types

The platform supports all Plaid account types:

- **Depository**: Checking, Savings, Money Market, CD
- **Credit**: Credit Card, Line of Credit
- **Loan**: Auto, Business, Commercial, Construction, Consumer, Home Equity, Mortgage, Student
- **Investment**: 401k, 403b, 457b, Brokerage, IRA, Roth IRA
- **Other**: Cash Management, Prepaid, Paypal, etc.

### Account Display

All accounts display:
- Institution name and logo
- Account name and mask
- Account type and subtype
- Current balance
- Available balance (when applicable)
- Credit limit (for credit accounts)
- Real-time sync status

### Usage Example

```typescript
import { sdk } from '@kronova-intelligent-systems/rspc-sdk'

// Get all accounts for an institution
const accounts = await sdk.getPlaidAccounts('plaid_item_id')

// Display account information
accounts.forEach(account => {
  console.log(\`\${account.institution_name} - \${account.name}\`)
  console.log(\`Type: \${account.type} / \${account.subtype}\`)
  console.log(\`Balance: \${account.balances.current}\`)
  
  if (account.balances.available) {
    console.log(\`Available: \${account.balances.available}\`)
  }
  
  if (account.balances.limit) {
    console.log(\`Credit Limit: \${account.balances.limit}\`)
  }
})
```

## Asset Gateway Integration

The SDK enables importing financial data as trackable assets:

```typescript
import { sdk } from '@kronova-intelligent-systems/rspc-sdk'

// Import bank accounts as assets
const assets = await Promise.all(
  accounts.map(account => sdk.createAsset({
    asset_id: \`bank_\${account.account_id}\`,
    name: account.name,
    asset_type: 'financial_account',
    category: \`\${account.type}_\${account.subtype}\`,
    current_value: account.balances.current,
    status: 'active',
    specifications: {
      account_id: account.account_id,
      institution: account.institution_name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask
    }
  }))
)
```

## Error Handling

Both SDKs provide comprehensive error handling:

```typescript
import { sdk } from '@kronova-intelligent-systems/rspc-sdk'

try {
  const asset = await sdk.createAsset(data)
} catch (error) {
  if (error.message.includes('already exists')) {
    // Handle duplicate asset
  } else if (error.message.includes('Unauthorized')) {
    // Handle auth error
  } else {
    // Handle other errors
  }
}
```

## Best Practices

1. **Use the SDK singleton** - Import `sdk` instead of creating new instances
2. **Handle errors gracefully** - All methods can throw, use try/catch
3. **Cache when possible** - SDK includes built-in caching for read operations
4. **Batch operations** - Use Promise.all for parallel requests
5. **Monitor rate limits** - Respect API rate limits for external services

## Performance

- **Rust Functions**: ~50-100ms cold start, ~5-10ms warm
- **TypeScript SDK**: ~2-5ms overhead for rspc wrapping
- **Plaid API**: ~200-500ms for real-time data
- **Caching**: 5-minute TTL for account data, reduces API calls by 95%
```
