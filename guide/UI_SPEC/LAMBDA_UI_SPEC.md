# AWS Lambda - Frontend UI Specification

## Overview
This document defines the exact UI behavior and backend integration for the AWS Lambda pricing calculator.

---

## UI Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚡ AWS Lambda Configuration                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📍 Region
   [Asia Pacific (Mumbai) ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️  ARCHITECTURE

   (•) x86_64 (Intel/AMD)    Standard pricing
   ( ) ARM64 (Graviton2)     ~20% cheaper
   
   💡 ARM offers better price-performance for most workloads

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FUNCTION CONFIGURATION

   Number of Requests
   ┌─────────────────────────────────────────────┐
   │  1,000,000                                  │
   └─────────────────────────────────────────────┘
   requests per month
   💡 First 1M requests FREE every month
   
   Average Duration per Request
   ┌─────────────────────────────────────────────┐
   │  200                                        │
   └─────────────────────────────────────────────┘
   milliseconds (1 - 900,000 ms)
   💡 Max execution time: 15 minutes (900,000 ms)
   
   Allocated Memory
   [  512  ▼] MB
   
   Options: 128 | 256 | 512 | 1024 | 1536 | 2048 | 3008 | 4096 | 
            5120 | 6144 | 7168 | 8192 | 9216 | 10240 MB
   
   💡 Memory also determines CPU allocation proportionally

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎁 FREE TIER (Toggle)

   [✓] Include Free Tier in calculation
   
   ┌──────────────────────────────────────────────────────┐
   │  📋 FREE TIER ALLOWANCES (Monthly)                  │
   │  ────────────────────────────────────────────────── │
   │  • 1,000,000 requests                               │
   │  • 400,000 GB-seconds (x86_64)                      │
   │  • 400,000 GB-seconds (ARM64)                       │
   │                                                      │
   │  ⚠️  Free Tier is shared across ALL Lambda          │
   │      functions in your account                       │
   └──────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ ADVANCED OPTIONS (Collapsible)

   Ephemeral Storage (/tmp)
   [  512  ▼] MB
   
   Options: 512 | 1024 | 2048 | 3072 | 4096 | 5120 | 6144 | 
            7168 | 8192 | 9216 | 10240 MB
   
   💡 First 512 MB is FREE. Additional storage: $0.0000000309/GB-second

   ────────────────────────────────────────────────────────
   
   Provisioned Concurrency (Optional)
   [ ] Enable Provisioned Concurrency
   
   Number of Provisioned Instances
   ┌─────────────────────────────────────────────┐
   │  0                                          │
   └─────────────────────────────────────────────┘
   concurrent executions
   
   💡 Keeps functions initialized for ultra-low latency
   ⚠️  Charges apply 24/7 regardless of actual invocations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ESTIMATED MONTHLY COST

   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │  📋 COST BREAKDOWN                                      │
   │  ─────────────────────────────────────────────────────  │
   │                                                         │
   │  Requests                                               │
   │    Total: 1,000,000 requests                           │
   │    Free Tier: -1,000,000 requests                      │
   │    Billable: 0 requests                                 │
   │    Cost:                               $0.00            │
   │                                                         │
   │  Compute (Duration)                                     │
   │    GB-Seconds: 102,400 GB-s                            │
   │    (1M × 200ms × 512MB ÷ 1024)                         │
   │    Free Tier: -102,400 GB-s                            │
   │    Billable: 0 GB-s                                     │
   │    Rate: $0.0000166667/GB-s (x86)                      │
   │    Cost:                               $0.00            │
   │                                                         │
   │  Ephemeral Storage                                      │
   │    Additional Storage: 0 MB                             │
   │    Cost:                               $0.00            │
   │                                                         │
   │  Provisioned Concurrency                                │
   │    Instances: 0                                         │
   │    Cost:                               $0.00            │
   │                                                         │
   │  ─────────────────────────────────────────────────────  │
   │                                                         │
   │  SUBTOTAL:                             $0.00            │
   │  Free Tier Savings:                   -$1.91            │
   │                                                         │
   │  ═══════════════════════════════════════════════════    │
   │  TOTAL:                           $0.00/month           │
   │  ═══════════════════════════════════════════════════    │
   │                                                         │
   └─────────────────────────────────────────────────────────┘
   
   [  Calculate  ]     [  Reset  ]     [  Add to Estimate  ]
```

---

## Field Specifications

### 1. Region Dropdown
- **Label:** "📍 Region"
- **Type:** Dropdown (searchable)
- **Default:** Asia Pacific (Mumbai)
- **Required:** Yes
- **Options:** All AWS regions where Lambda is available
- **Backend Mapping:**
  ```javascript
  const REGION_MAP = {
    "US East (N. Virginia)": "us-east-1",
    "US East (Ohio)": "us-east-2",
    "US West (N. California)": "us-west-1",
    "US West (Oregon)": "us-west-2",
    "Asia Pacific (Mumbai)": "ap-south-1",
    "Asia Pacific (Hyderabad)": "ap-south-2",
    "Asia Pacific (Singapore)": "ap-southeast-1",
    "Asia Pacific (Sydney)": "ap-southeast-2",
    "Asia Pacific (Jakarta)": "ap-southeast-3",
    "Asia Pacific (Melbourne)": "ap-southeast-4",
    "Asia Pacific (Tokyo)": "ap-northeast-1",
    "Asia Pacific (Seoul)": "ap-northeast-2",
    "Asia Pacific (Osaka)": "ap-northeast-3",
    "Asia Pacific (Hong Kong)": "ap-east-1",
    "Canada (Central)": "ca-central-1",
    "Canada West (Calgary)": "ca-west-1",
    "EU (Ireland)": "eu-west-1",
    "EU (London)": "eu-west-2",
    "EU (Paris)": "eu-west-3",
    "EU (Frankfurt)": "eu-central-1",
    "EU (Zurich)": "eu-central-2",
    "EU (Stockholm)": "eu-north-1",
    "EU (Milan)": "eu-south-1",
    "EU (Spain)": "eu-south-2",
    "South America (São Paulo)": "sa-east-1",
    "Middle East (UAE)": "me-central-1",
    "Middle East (Bahrain)": "me-south-1",
    "Africa (Cape Town)": "af-south-1",
    "Israel (Tel Aviv)": "il-central-1"
  };
  ```

### 2. Architecture Radio Buttons
- **Label:** "⚙️ ARCHITECTURE"
- **Type:** Radio buttons
- **Default:** x86_64
- **Required:** Yes
- **Options:**
  | Display Text | Value | Description |
  |--------------|-------|-------------|
  | x86_64 (Intel/AMD) | `x86_64` | Standard pricing |
  | ARM64 (Graviton2) | `arm64` | ~20% cheaper |
- **Impact:** Changes compute pricing rate
- **Backend Mapping:**
  ```javascript
  const ARCHITECTURE_MAP = {
    "x86_64": "x86_64",
    "ARM64": "arm64"
  };
  ```

### 3. Number of Requests
- **Label:** "Number of Requests"
- **Type:** Number input with formatting
- **Default:** 1,000,000
- **Min:** 0
- **Max:** No limit (use BigInt for very large numbers)
- **Required:** Yes
- **Unit Display:** "requests per month"
- **Format:** Comma-separated thousands (1,000,000)
- **Tooltip:** "The total number of Lambda function invocations per month"
- **Note:** "💡 First 1M requests FREE every month"

### 4. Average Duration
- **Label:** "Average Duration per Request"
- **Type:** Number input
- **Default:** 200
- **Min:** 1
- **Max:** 900,000 (15 minutes in milliseconds)
- **Required:** Yes
- **Unit Display:** "milliseconds"
- **Tooltip:** "Average execution time of your Lambda function"
- **Note:** "💡 Max execution time: 15 minutes (900,000 ms)"
- **Validation:** 
  - Must be ≥ 1 ms
  - Must be ≤ 900,000 ms
  - Show warning if > 30,000 ms (30 seconds)

### 5. Allocated Memory
- **Label:** "Allocated Memory"
- **Type:** Dropdown
- **Default:** 512 MB
- **Required:** Yes
- **Options (MB):**
  ```javascript
  const MEMORY_OPTIONS = [
    128, 256, 512, 1024, 1536, 2048, 3008, 4096,
    5120, 6144, 7168, 8192, 9216, 10240
  ];
  ```
- **Unit Display:** "MB"
- **Tooltip:** "Memory also determines proportional CPU allocation"
- **Note:** "💡 Memory also determines CPU allocation proportionally"
- **Backend Value:** Send as integer (MB)

### 6. Free Tier Toggle
- **Label:** "Include Free Tier in calculation"
- **Type:** Checkbox
- **Default:** Checked (true)
- **Required:** No
- **Impact:** Subtracts free tier allowances from billable usage
- **Free Tier Values:**
  - 1,000,000 requests/month
  - 400,000 GB-seconds/month (applies to both x86 and ARM)

### 7. Ephemeral Storage (Advanced)
- **Label:** "Ephemeral Storage (/tmp)"
- **Type:** Dropdown
- **Default:** 512 MB
- **Required:** No (defaults to 512 MB if not specified)
- **Options (MB):**
  ```javascript
  const STORAGE_OPTIONS = [
    512, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192, 9216, 10240
  ];
  ```
- **Unit Display:** "MB"
- **Note:** "💡 First 512 MB is FREE. Additional: $0.0000000309/GB-second"
- **Backend Value:** Send as integer (MB)

### 8. Provisioned Concurrency (Advanced)
- **Label:** "Enable Provisioned Concurrency"
- **Type:** Checkbox + Number input
- **Default:** Unchecked, 0 instances
- **Required:** No
- **Sub-field (when enabled):**
  - **Label:** "Number of Provisioned Instances"
  - **Type:** Number input
  - **Default:** 1
  - **Min:** 1
  - **Max:** 5000
- **Note:** "💡 Keeps functions warm for ultra-low latency"
- **Warning:** "⚠️ Charges apply 24/7 regardless of actual invocations"

---

## Pricing Formulas

### Request Pricing
```
Rate: $0.20 per 1 million requests
Formula: (requests - free_tier_requests) × $0.0000002

Free Tier: 1,000,000 requests/month

Example:
  2,000,000 requests
  Billable: 2,000,000 - 1,000,000 = 1,000,000
  Cost: 1,000,000 × $0.0000002 = $0.20
```

### Compute (Duration) Pricing
```
x86_64 Rate: $0.0000166667 per GB-second
ARM64 Rate:  $0.0000133334 per GB-second (~20% cheaper)

Formula:
  gb_seconds = requests × (duration_ms / 1000) × (memory_mb / 1024)
  billable_gb_seconds = gb_seconds - free_tier_gb_seconds
  cost = billable_gb_seconds × rate

Free Tier: 400,000 GB-seconds/month

Example (x86_64):
  1,000,000 requests × 200ms × 512MB
  = 1,000,000 × 0.2 × 0.5 GB
  = 100,000 GB-seconds
  
  Billable: 100,000 - 400,000 = 0 (within free tier)
  Cost: $0.00
```

### Ephemeral Storage Pricing
```
Rate: $0.0000000309 per GB-second
Free: First 512 MB

Formula:
  additional_storage_mb = ephemeral_storage_mb - 512
  additional_storage_gb = additional_storage_mb / 1024
  storage_gb_seconds = requests × (duration_ms / 1000) × additional_storage_gb
  cost = storage_gb_seconds × $0.0000000309

Example:
  1,024 MB storage, 1M requests, 200ms duration
  Additional: 1024 - 512 = 512 MB = 0.5 GB
  GB-seconds: 1,000,000 × 0.2 × 0.5 = 100,000 GB-s
  Cost: 100,000 × $0.0000000309 = $3.09
```

### Provisioned Concurrency Pricing
```
Compute Rate: $0.000004167 per GB-second (x86)
              $0.000003334 per GB-second (ARM, ~20% cheaper)

Formula:
  hours_per_month = 730 (average)
  seconds_per_month = 730 × 3600 = 2,628,000
  provisioned_gb_seconds = instances × (memory_mb / 1024) × seconds_per_month
  cost = provisioned_gb_seconds × rate

Example (x86_64):
  5 instances × 512 MB = 5 × 0.5 GB = 2.5 GB
  GB-seconds: 2.5 × 2,628,000 = 6,570,000 GB-s
  Cost: 6,570,000 × $0.000004167 = $27.38/month

Note: Actual invocations on provisioned instances use lower duration rate:
  x86: $0.000009722 per GB-second (vs $0.0000166667 on-demand)
  ARM: $0.000007778 per GB-second (vs $0.0000133334 on-demand)
```

---

## Backend API Integration

### Endpoint
```
POST /api/lambda/calculate
```

### Request Payload
```json
{
  "region": "ap-south-1",
  "architecture": "x86_64",
  "requests_per_month": 1000000,
  "duration_ms": 200,
  "memory_mb": 512,
  "include_free_tier": true,
  "ephemeral_storage_mb": 512,
  "provisioned_concurrency": 0
}
```

### Request Field Details
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `region` | string | Yes | - | AWS region code |
| `architecture` | string | Yes | `x86_64` | `x86_64` or `arm64` |
| `requests_per_month` | integer | Yes | - | Number of invocations |
| `duration_ms` | integer | Yes | - | Avg duration in milliseconds |
| `memory_mb` | integer | Yes | - | Allocated memory in MB |
| `include_free_tier` | boolean | No | `true` | Apply free tier discounts |
| `ephemeral_storage_mb` | integer | No | `512` | /tmp storage in MB |
| `provisioned_concurrency` | integer | No | `0` | Number of provisioned instances |

### Response Format
```json
{
  "service": "lambda",
  "region": "ap-south-1",
  "architecture": "x86_64",
  "monthly_cost": {
    "total": 0.00,
    "requests": 0.00,
    "compute": 0.00,
    "ephemeral_storage": 0.00,
    "provisioned_concurrency": 0.00
  },
  "usage": {
    "requests": {
      "total": 1000000,
      "free_tier": 1000000,
      "billable": 0,
      "rate_per_million": 0.20
    },
    "compute": {
      "total_gb_seconds": 102400.00,
      "free_tier_gb_seconds": 400000,
      "billable_gb_seconds": 0,
      "rate_per_gb_second": 0.0000166667
    },
    "ephemeral_storage": {
      "configured_mb": 512,
      "additional_mb": 0,
      "total_gb_seconds": 0,
      "rate_per_gb_second": 0.0000000309
    },
    "provisioned_concurrency": {
      "instances": 0,
      "total_gb_seconds": 0,
      "rate_per_gb_second": 0.000004167
    }
  },
  "free_tier_applied": true,
  "free_tier_savings": 1.91,
  "notes": [
    "All calculations assume average values",
    "Actual costs may vary based on usage patterns"
  ]
}
```

### Example Responses

**Basic Function (Within Free Tier):**
```json
{
  "service": "lambda",
  "region": "ap-south-1",
  "architecture": "x86_64",
  "monthly_cost": {
    "total": 0.00,
    "requests": 0.00,
    "compute": 0.00,
    "ephemeral_storage": 0.00,
    "provisioned_concurrency": 0.00
  },
  "usage": {
    "requests": {
      "total": 1000000,
      "free_tier": 1000000,
      "billable": 0,
      "rate_per_million": 0.20
    },
    "compute": {
      "total_gb_seconds": 102400.00,
      "free_tier_gb_seconds": 400000,
      "billable_gb_seconds": 0,
      "rate_per_gb_second": 0.0000166667
    }
  },
  "free_tier_applied": true,
  "free_tier_savings": 1.91
}
```

**High-Volume Function (ARM, No Free Tier):**
```json
{
  "service": "lambda",
  "region": "us-east-1",
  "architecture": "arm64",
  "monthly_cost": {
    "total": 177.33,
    "requests": 2.00,
    "compute": 133.33,
    "ephemeral_storage": 15.45,
    "provisioned_concurrency": 26.55
  },
  "usage": {
    "requests": {
      "total": 10000000,
      "free_tier": 0,
      "billable": 10000000,
      "rate_per_million": 0.20
    },
    "compute": {
      "total_gb_seconds": 10000000,
      "free_tier_gb_seconds": 0,
      "billable_gb_seconds": 10000000,
      "rate_per_gb_second": 0.0000133334
    },
    "ephemeral_storage": {
      "configured_mb": 1024,
      "additional_mb": 512,
      "total_gb_seconds": 500000,
      "rate_per_gb_second": 0.0000000309
    },
    "provisioned_concurrency": {
      "instances": 5,
      "total_gb_seconds": 6570000,
      "rate_per_gb_second": 0.000003334
    }
  },
  "free_tier_applied": false,
  "free_tier_savings": 0
}
```

---

## Validation Rules

### Frontend Validation
```javascript
const validationRules = {
  region: {
    required: true,
    message: "Please select a region"
  },
  architecture: {
    required: true,
    enum: ["x86_64", "arm64"],
    message: "Please select an architecture"
  },
  requests_per_month: {
    required: true,
    min: 0,
    type: "integer",
    message: "Requests must be 0 or greater"
  },
  duration_ms: {
    required: true,
    min: 1,
    max: 900000,
    type: "integer",
    message: "Duration must be between 1 and 900,000 ms"
  },
  memory_mb: {
    required: true,
    enum: [128, 256, 512, 1024, 1536, 2048, 3008, 4096, 5120, 6144, 7168, 8192, 9216, 10240],
    message: "Please select a valid memory size"
  },
  ephemeral_storage_mb: {
    required: false,
    min: 512,
    max: 10240,
    default: 512,
    message: "Storage must be between 512 and 10,240 MB"
  },
  provisioned_concurrency: {
    required: false,
    min: 0,
    max: 5000,
    default: 0,
    message: "Provisioned concurrency must be between 0 and 5,000"
  }
};
```

### Warning Conditions
1. **Long Duration:** Show warning when `duration_ms > 30000`
   - Message: "⚠️ Functions running >30 seconds may benefit from other compute options"
   
2. **High Memory:** Show info when `memory_mb >= 3008`
   - Message: "💡 At 3GB+, you get 2 vCPUs. At 5GB+, you get 3 vCPUs"
   
3. **Provisioned Concurrency without requests:**
   - Warning: "⚠️ Provisioned concurrency charges apply even with 0 requests"

4. **Large Storage:** Show info when `ephemeral_storage_mb > 512`
   - Message: "💡 Consider EFS for larger or persistent storage needs"

---

## UI Behavior

### On Architecture Change
1. Update compute rate display
2. Recalculate estimate if auto-calculate is enabled
3. Update rate labels in breakdown

### On Free Tier Toggle
1. Recalculate all costs
2. Show/hide free tier deduction lines in breakdown
3. Update savings display

### On Provisioned Concurrency Toggle
1. Show/hide provisioned instances input
2. Recalculate costs
3. Show warning about 24/7 charges

### Advanced Options Section
1. Default: Collapsed
2. Show indicator if any advanced option is non-default
3. Expand on click or if any advanced option has non-default value

### Calculate Button
1. Validate all inputs
2. Show loading state
3. Call API
4. Display results in breakdown section
5. Highlight any free tier savings

### Reset Button
1. Reset all fields to defaults
2. Clear results display
3. Do NOT automatically recalculate

---

## Error Handling

### API Errors
```javascript
const errorMessages = {
  400: "Invalid input parameters. Please check your values.",
  404: "Region or pricing data not available.",
  500: "Server error. Please try again later.",
  network: "Network error. Please check your connection."
};
```

### Display Format
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  Error                                              │
│  ─────────────────────────────────────────────────────  │
│  Could not calculate pricing: [error message]          │
│                                                         │
│  [Try Again]                                            │
└─────────────────────────────────────────────────────────┘
```

---

## Responsive Design Notes

### Mobile (< 768px)
- Stack all sections vertically
- Full-width inputs
- Breakdown in collapsible accordion
- Sticky Calculate button at bottom

### Tablet (768px - 1024px)
- Two-column layout for some fields
- Side-by-side architecture options

### Desktop (> 1024px)
- Full layout as shown
- Inline tooltips
- Hover states for interactive elements

---

## Accessibility

1. **Labels:** All inputs have associated labels
2. **ARIA:** Use `aria-describedby` for hints/notes
3. **Keyboard:** Full keyboard navigation support
4. **Screen Readers:** Announce cost updates
5. **Color:** Don't rely solely on color for information
6. **Focus:** Visible focus indicators

---

## Frontend Implementation Checklist

- [ ] Create region dropdown with display names and mapping
- [ ] Implement architecture radio buttons with pricing impact
- [ ] Add requests input with number formatting
- [ ] Add duration input with validation (1-900,000 ms)
- [ ] Create memory dropdown with all valid options
- [ ] Implement free tier toggle with savings display
- [ ] Add collapsible advanced options section
- [ ] Implement ephemeral storage dropdown
- [ ] Add provisioned concurrency checkbox and input
- [ ] Build request payload with all parameters
- [ ] Call backend API endpoint
- [ ] Parse and display cost breakdown
- [ ] Show free tier savings when applicable
- [ ] Handle all error states
- [ ] Add loading states
- [ ] Format currency display ($X.XX)
- [ ] Add tooltips and help text
- [ ] Implement responsive design
- [ ] Test accessibility compliance

---

## Notes

1. **Duration Billing:** AWS bills in 1ms increments (minimum 1ms)
2. **Memory ↔ CPU:** Memory allocation directly affects CPU allocation
3. **Concurrent Executions:** Default account limit is 1,000 concurrent executions
4. **Cold Starts:** Not directly calculated but mentioned in provisioned concurrency section
5. **Data Transfer:** Not included - separate pricing category
6. **Lambda@Edge:** Different pricing, not included in this calculator
7. **Savings Plans:** Not included - would reduce compute costs up to 17%
