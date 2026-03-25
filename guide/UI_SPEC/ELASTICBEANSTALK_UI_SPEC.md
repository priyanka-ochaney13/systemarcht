# AWS Elastic Beanstalk - Frontend UI Specification

## Overview
This document defines the exact UI behavior and backend integration for the AWS Elastic Beanstalk pricing calculator. Elastic Beanstalk is a managed platform service that deploys and scales EC2 instances, load balancers, and storage. Unlike Beanstalk itself (which has no direct charges), this calculator estimates the total cost of AWS resources deployed by Beanstalk.

---

## UI Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🚀 Elastic Beanstalk Deployment Configuration                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📍 Region
   [Asia Pacific (Mumbai) ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️  ENVIRONMENT CONFIGURATION

   Environment Type
   ◉ Single Instance    ○ Load Balanced
   💡 Single instance is good for development/testing. Load balanced for production.

   Instance Type (Searchable)
   [t3.small - 2 vCPU, 2GB RAM ▼]
   💡 Choose based on workload: General Purpose (t2/t3) for web, Compute (c5) for processing

   Number of Instances
   [1        ]  (Range: 1-100)
   ⚠️  Load balancer recommended for 2+ instances

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️  LOAD BALANCER & SCALING (Collapsible)

   ☐ Enable Application Load Balancer
   
   Cross-Zone Load Balancing
   ☐ Enabled (adds $0.0050/LB-hour)

   Auto-Scaling Configuration
   ☐ Enable Auto-Scaling

   [Minimum Instances: 1     ]
   [Maximum Instances: 10    ]
   [Target CPU Utilization: 70    %]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 STORAGE & MONITORING (Collapsible)

   ROOT VOLUME (EBS)
   [ 30  ] GB (Default: 30 GB, Max: 16,000 GB)
   
   Volume Type
   ○ General Purpose (gp3) - $0.10/GB-month
   ◉ Provisioned IOPS (io2) - $0.125/GB-month + IOPS cost
   ○ Magnetic (standard) - $0.05/GB-month

   Enable Enhanced Monitoring
   ☐ Enhanced monitoring ($0.35/instance)
   💡 Detailed CloudWatch metrics every 1 minute (vs 5 min standard)

   Estimated Outbound Data Transfer
   [10  ] GB per month (Free: first 1 GB)
   💡 Data transfer OUT to internet: $0.09/GB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎁 FREE TIER (Collapsible)

   ☐ Include 12-month AWS Free Tier

   Available to first-time users only
   💡 950 hours/month t2.micro + 30 GB EBS storage FREE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ESTIMATED MONTHLY COST

   ┌─────────────────────────────────────────────────────────┐
   │ EC2 Instances                      [Breakdown ℹ️]       │
   │   1 x t3.small @ $0.0209/h × 730h      $15.26          │
   │ ─────────────────────────────────────────────────────  │
   │ Load Balancer (if enabled)         [Breakdown ℹ️]       │
   │   ALB Hourly: $0.0225/h × 730h = $16.43               │
   │   LCU Usage: 2 LCU × $0.0080/h × 730h = $11.68         │
   │ ─────────────────────────────────────────────────────  │
   │ EBS Storage                        [Breakdown ℹ️]       │
   │   30 GB @ $0.10/GB-month = $3.00                       │
   │ ─────────────────────────────────────────────────────  │
   │ Enhanced Monitoring                [Breakdown ℹ️]       │
   │   1 instance @ $0.35/inst = $0.35                      │
   │ ─────────────────────────────────────────────────────  │
   │ Data Transfer Out                  [Breakdown ℹ️]       │
   │   10 GB @ $0.09/GB = $0.90                             │
   │ ─────────────────────────────────────────────────────  │
   │ Free Tier Savings                     -$15.26          │
   │═════════════════════════════════════════════════════════│
   │ TOTAL MONTHLY COST                        $33.05        │
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
- **Options:** All AWS regions where Elastic Beanstalk is available
- **Backend Mapping:**
  ```javascript
  const REGIONS = {
    "us-east-1": "US East (N. Virginia)",
    "us-east-2": "US East (Ohio)",
    "us-west-1": "US West (N. California)",
    "us-west-2": "US West (Oregon)",
    "ap-south-1": "Asia Pacific (Mumbai)",
    "ap-southeast-1": "Asia Pacific (Singapore)",
    "ap-southeast-2": "Asia Pacific (Sydney)",
    "eu-west-1": "EU (Ireland)",
    "eu-central-1": "EU (Frankfurt)",
    "ca-central-1": "Canada (Central)",
    "ap-northeast-1": "Asia Pacific (Tokyo)"
  };
  ```

### 2. Environment Type Radio Buttons
- **Label:** "🖥️ ENVIRONMENT CONFIGURATION → Environment Type"
- **Type:** Radio buttons (2 options)
- **Default:** Single Instance
- **Required:** Yes
- **Options:**
  | Display Text | Value | Description |
  |---|---|---|
  | Single Instance | `single` | Best for development/testing. 1 instance, no load balancer. |
  | Load Balanced | `load_balanced` | Best for production. Multiple instances, ALB, auto-scaling capable. |
- **Impact:** 
  - "load_balanced" enables Load Balancer and Auto-Scaling sections
  - "single" hides those sections, forces instance_count=1
  - "load_balanced" requires at least 2 instances
- **Backend Mapping:**
  ```javascript
  environment_type: "single" | "load_balanced"
  ```

### 3. Instance Type Dropdown (Searchable, Grouped)
- **Label:** "Instance Type (Searchable)"
- **Type:** Dropdown with search/filter
- **Default:** t3.small
- **Required:** Yes
- **Grouping:** Show instances organized by family
  ```
  📦 General Purpose (Cost-effective, burstable)
    t2.micro      | 1 vCPU, 1 GB RAM     | $0.0116/h
    t2.small      | 1 vCPU, 2 GB RAM     | $0.0232/h
    t3.small      | 2 vCPU, 2 GB RAM     | $0.0209/h
    t3.medium     | 2 vCPU, 4 GB RAM     | $0.0418/h
    m5.large      | 2 vCPU, 8 GB RAM     | $0.096/h
    m5.xlarge     | 4 vCPU, 16 GB RAM    | $0.192/h
    m6i.large     | 2 vCPU, 8 GB RAM     | $0.096/h

  ⚡ Compute Optimized (High performance)
    c5.large      | 2 vCPU, 4 GB RAM     | $0.085/h
    c5.xlarge     | 4 vCPU, 8 GB RAM     | $0.170/h
    c6i.large     | 2 vCPU, 4 GB RAM     | $0.085/h
    c6i.xlarge    | 4 vCPU, 8 GB RAM     | $0.170/h

  💾 Memory Optimized (In-memory databases, caching)
    r5.large      | 2 vCPU, 16 GB RAM    | $0.252/h
    r5.xlarge     | 4 vCPU, 32 GB RAM    | $0.504/h
    r6i.large     | 2 vCPU, 16 GB RAM    | $0.252/h
    r6i.xlarge    | 4 vCPU, 32 GB RAM    | $0.504/h

  🎮 GPU Instances (Machine learning, graphics processing)
    g4dn.xlarge   | 4 vCPU, 16 GB RAM, 1 GPU | $0.526/h

  📊 Storage Optimized (Big data, data warehousing)
    i3.large      | 2 vCPU, 15.25 GB RAM | $0.312/h
    i3.xlarge     | 4 vCPU, 30.5 GB RAM  | $0.624/h
  ```
- **Search Behavior:** Filters by instance name, family, or vCPU count
- **Display on Selection:** "t3.small - 2 vCPU, 2GB RAM - $0.0209/h" (show specs and hourly rate)
- **Tooltip:** "Choose based on workload: General Purpose (t2/t3) for web apps, Compute (c5/c6i) for processing, Memory (r5/r6i) for in-memory databases"
- **Backend Value:** Send as string, e.g., "t3.small"

### 4. Number of Instances
- **Label:** "Number of Instances"
- **Type:** Number input with spinner or slider
- **Default:** 1
- **Min:** 1
- **Max:** 100
- **Required:** Yes
- **Unit Display:** "instances"
- **Validation Rules:**
  - If environment_type = "single": Force value to 1 (disable input)
  - If environment_type = "load_balanced": Require ≥ 2
  - Show warning: "⚠️ Consider 2-3 instances minimum for production HA"
- **Note:** "⚠️ Load balancer recommended for 2+ instances"
- **Backend Value:** Send as integer

### 5. Load Balancer Section (Collapsible, appears only if load_balanced)
- **Label:** "⚖️ LOAD BALANCER & SCALING (Collapsible)"
- **Default:** Collapsed
- **Appears Only If:** environment_type = "load_balanced"

#### 5a. Enable Application Load Balancer
- **Label:** "☐ Enable Application Load Balancer"
- **Type:** Checkbox
- **Default:** Checked if load_balanced, unchecked if single
- **Impact:** Shows/hides ALB cost, enables LCU calculation
- **Cost:** $0.0225/hour + LCU charges
- **Backend Value:** `enable_load_balancer: boolean`

#### 5b. Cross-Zone Load Balancing
- **Label:** "Cross-Zone Load Balancing"
- **Type:** Checkbox (appears only if ALB enabled)
- **Default:** Unchecked
- **Cost Impact:** +$0.0050/LB-hour if enabled
- **Backend Value:** `cross_zone_enabled: boolean`

#### 5c. Auto-Scaling Configuration
- **Label:** "Auto-Scaling Configuration"
- **Type:** Checkbox (appears only if load_balanced)
- **Default:** Unchecked
- **Sub-fields (when enabled):**
  - Min Instances: [1] (default: 1, range: 1-100)
  - Max Instances: [10] (default: 10, range: 1-100)
  - Target CPU Utilization: [70] % (default: 70, range: 10-100)
- **Cost Impact:** +$0.04 per scaling policy per month
- **Backend Values:**
  ```javascript
  {
    "enable_auto_scaling": boolean,
    "min_instances": integer,
    "max_instances": integer,
    "target_cpu_utilization": integer (10-100)
  }
  ```

### 6. Storage & Monitoring Section (Collapsible)
- **Label:** "💾 STORAGE & MONITORING (Collapsible)"
- **Default:** Collapsed

#### 6a. Root Volume (EBS)
- **Label:** "ROOT VOLUME (EBS)"
- **Type:** Number input
- **Default:** 30 GB
- **Min:** 1 GB
- **Max:** 16,000 GB
- **Required:** Yes
- **Unit Display:** "GB"
- **Note:** "💡 Linux root volume minimum is 8 GB, Windows is 30 GB"
- **Backend Value:** Send as integer (GB)

#### 6b. Volume Type
- **Label:** "Volume Type"
- **Type:** Radio buttons (3 options)
- **Default:** General Purpose (gp3)
- **Options:**
  | Display Text | Value | Unit Cost | Description |
  |---|---|---|---|
  | General Purpose (gp3) | `gp3` | $0.10/GB-month | Good for web, apps, most workloads |
  | Provisioned IOPS (io2) | `io2` | $0.125/GB-month | High IOPS, databases, high-traffic |
  | Magnetic (standard) | `standard` | $0.05/GB-month | Old/legacy, low performance |
- **Backend Mapping:**
  ```javascript
  {
    "gp3": 0.10,
    "io2": 0.125,
    "standard": 0.05
  }
  ```

#### 6c. Enhanced Monitoring
- **Label:** "Enable Enhanced Monitoring"
- **Type:** Checkbox
- **Default:** Unchecked
- **Cost:** $0.35 per instance per month
- **Tooltip:** "Detailed CloudWatch metrics every 1 minute (vs. 5 min standard)"
- **Backend Value:** `enable_enhanced_monitoring: boolean`

#### 6d. Data Transfer
- **Label:** "Estimated Outbound Data Transfer"
- **Type:** Number input
- **Default:** 10 GB
- **Min:** 0
- **Max:** 1,000,000 GB
- **Unit Display:** "GB per month"
- **Pricing:** $0.09/GB (first 1 GB free)
- **Backend Value:** Send as integer

### 7. Free Tier Section (Collapsible)
- **Label:** "🎁 FREE TIER (Collapsible)"
- **Default:** Collapsed
- **Sub-field:**
  - **Checkbox:** "☐ Include 12-month AWS Free Tier"
  - **Default:** Unchecked
  - **Note:** "Available to first-time users only. 950 hours/month t2.micro + 30 GB EBS storage FREE"
  - **Availability:** Only if instance_type = "t2.micro" AND instance_count = 1 AND NOT auto-scaling
  - **Backend Value:** `include_free_tier: boolean`

---

## Pricing Formulas

### EC2 Instance Pricing
```
Rate: Instance-specific hourly rate (varies by type and region)
Formula: num_instances × hourly_rate × 730 hours/month

Example (us-east-1):
  2 × t3.small @ $0.0209/h × 730h = $30.52/month

Regional Override:
  ap-south-1 rates ~15% cheaper
  eu-central-1 rates ~5% higher
  All rates in pricing_data/elastic_beanstalk.json per region
```

### Application Load Balancer Pricing
```
Base Hourly Charge: $0.0225/hour
LCU (Processed Bytes): Calculated from estimated traffic
Formula:
  alb_hourly = $0.0225 × 730 hours
  lcu_charge = num_lcu × $0.0080/hour × 730 hours
  
  ALB Cost = alb_hourly + lcu_charge
  Default: 2 LCU average per setup = (2 × $0.0080 × 730) = $11.68

Cross-Zone Load Balancing (if enabled):
  additional_cost = $0.0050/hour × 730 = $3.65/month

Example:
  ALB: $16.43 + LCU: $11.68 + Cross-Zone: $3.65 = $31.76/month
```

### EBS Storage Pricing
```
Rate: Depends on volume type (gp3, io2, standard)
Formula: storage_gb × rate_per_gb × 30 days (normalized to "per month")

gp3: storage_gb × $0.10
io2: storage_gb × $0.125
standard: storage_gb × $0.05

Example:
  50 GB gp3 = 50 × $0.10 = $5.00/month
  50 GB io2 = 50 × $0.125 = $6.25/month
```

### Auto-Scaling Policy Cost
```
Rate: $0.04 per scaling policy per month
Formula: num_policies × $0.04

Example:
  1 policy (CPU-based) = 1 × $0.04 = $0.04/month
```

### Enhanced Monitoring Cost
```
Rate: $0.35 per instance per month
Formula: num_instances × $0.35

Example:
  3 instances = 3 × $0.35 = $1.05/month
```

### Data Transfer Cost
```
Rate: $0.09 per GB (free tier: first 1 GB/month)
Formula: max(0, data_transfer_gb - 1) × $0.09

Example:
  10 GB/month: (10 - 1) × $0.09 = $0.81/month
  0.5 GB/month: FREE (within free tier)
```

### Free Tier Savings (12-month only)
```
Conditions:
  - include_free_tier = true
  - instance_type = "t2.micro"
  - instance_count = 1
  - enable_auto_scaling = false
  - enable_load_balancer = false

Free Allowance:
  - 950 hours/month on-demand (750 hrs reserved, 200 hrs shared)
  - 30 GB EBS storage

Calculation:
  Free Hours = 950 hours/month
  Billable Hours = max(0, hours_in_month - 950)
  
  At 730 hours/month (average):
    Billable = max(0, 730 - 950) = 0
    Savings = t2.micro hourly rate × 730 = $0.0116 × 730 = $8.47/month

  Storage:
    Free = 30 GB
    Billable = max(0, total_gb - 30)
    If using exactly 30 GB: $0 storage cost

Example (First 12 months, single t2.micro):
  Instance Cost: $0 (within free tier)
  Storage: $0 (30 GB free)
  Total: $0.00/month
  
  If 60 GB storage:
  Storage Cost: (60 - 30) × $0.10 = $3.00/month
  Total: $3.00/month
```

### Total Monthly Cost
```
Total = EC2_Cost + ALB_Cost + Storage_Cost + Monitoring_Cost + 
        Scaling_Cost + DataTransfer_Cost - Free_Tier_Savings

Constraint:
  If include_free_tier = true AND eligible:
    - EC2_Cost becomes $0 (within allowance)
    - Storage_Cost becomes max(0, storage_gb - 30) × rate
    - Display "✓ Free tier active (expires in X months)"
```

---

## Backend API Integration

### Endpoint
```
POST /api/elastic-beanstalk/calculate
```

### Request Payload
```json
{
  "region": "ap-south-1",
  "environment_type": "load_balanced",
  "instance_type": "t3.small",
  "instance_count": 2,
  "enable_load_balancer": true,
  "cross_zone_enabled": false,
  "enable_auto_scaling": true,
  "min_instances": 1,
  "max_instances": 10,
  "target_cpu_utilization": 70,
  "storage_gb": 30,
  "volume_type": "gp3",
  "enable_enhanced_monitoring": false,
  "data_transfer_gb": 10,
  "include_free_tier": false
}
```

### Request Field Details
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `region` | string | Yes | - | AWS region code |
| `environment_type` | string | Yes | `single` | `single` or `load_balanced` |
| `instance_type` | string | Yes | - | EC2 instance type (e.g., t3.small) |
| `instance_count` | integer | Yes | 1 | Number of instances (1-100) |
| `enable_load_balancer` | boolean | No | false | Enable ALB |
| `cross_zone_enabled` | boolean | No | false | Cross-zone load balancing |
| `enable_auto_scaling` | boolean | No | false | Enable auto-scaling |
| `min_instances` | integer | No | 1 | Minimum auto-scale instances |
| `max_instances` | integer | No | 10 | Maximum auto-scale instances |
| `target_cpu_utilization` | integer | No | 70 | Target CPU % for scaling |
| `storage_gb` | integer | No | 30 | EBS root volume size |
| `volume_type` | string | No | `gp3` | EBS volume type |
| `enable_enhanced_monitoring` | boolean | No | false | Enable detailed monitoring |
| `data_transfer_gb` | integer | No | 10 | Monthly outbound data transfer |
| `include_free_tier` | boolean | No | false | Apply free tier discounts |

### Response Format
```json
{
  "service": "elastic_beanstalk",
  "breakdown": {
    "total_cost": 47.33,
    "ec2_instances_cost": 20.90,
    "load_balancer_cost": 0.0,
    "ebs_storage_cost": 3.00,
    "enhanced_monitoring_cost": 0.0,
    "data_transfer_cost": 0.81,
    "auto_scaling_cost": 0.0,
    "free_tier_savings": 0.0
  },
  "usage_details": {
    "total_instance_hours": 1460,
    "billable_instance_hours": 1460,
    "storage_gb": 30,
    "billable_storage_gb": 30,
    "data_transfer_gb": 10,
    "billable_data_transfer_gb": 9,
    "num_scaling_policies": 0,
    "monitored_instances": 0
  },
  "configuration": {
    "region": "ap-south-1",
    "region_display_name": "Asia Pacific (Mumbai)",
    "environment_type": "load_balanced",
    "instance_type": "t3.small",
    "instance_count": 2,
    "hourly_rate_per_instance": 0.0209,
    "alb_enabled": false,
    "auto_scaling_enabled": false,
    "enhanced_monitoring_enabled": false
  },
  "free_tier_eligible": false,
  "free_tier_applied": false,
  "notes": [
    "This is a development/test estimate",
    "Production workloads typically require load balancer"
  ]
}
```

### Support Endpoints

#### Get Regions
```
GET /api/elastic-beanstalk/regions

Response:
{
  "regions": [
    {"code": "us-east-1", "name": "US East (N. Virginia)"},
    {"code": "us-east-2", "name": "US East (Ohio)"},
    ...
  ]
}
```

#### Get Instance Types
```
GET /api/elastic-beanstalk/instance-types?region=ap-south-1

Response:
{
  "instance_types": [
    {
      "type": "t2.micro",
      "family": "General Purpose",
      "vcpu": 1,
      "memory_gb": 1,
      "hourly_rate": 0.0116,
      "network_performance": "Low"
    },
    {
      "type": "t3.small",
      "family": "General Purpose",
      "vcpu": 2,
      "memory_gb": 2,
      "hourly_rate": 0.0209,
      "network_performance": "Low to Moderate"
    },
    ...
  ]
}
```

#### Get Pricing Info
```
GET /api/elastic-beanstalk/pricing-info

Response:
{
  "alb_hourly_rate": 0.0225,
  "lcu_hourly_rate": 0.0080,
  "cross_zone_hourly_rate": 0.0050,
  "enhanced_monitoring_rate": 0.35,
  "auto_scaling_policy_rate": 0.04,
  "data_transfer_rate": 0.09,
  "free_tier": {
    "monthly_hours": 950,
    "free_storage_gb": 30,
    "eligible_instance_type": "t2.micro",
    "duration_months": 12
  }
}
```

---

## Validation Rules

### Frontend Validation
```javascript
const validationRules = {
  region: {
    required: true,
    type: 'string',
    enum: ['us-east-1', 'us-east-2', ...]
  },
  instance_type: {
    required: true,
    type: 'string',
    enum: ['t2.micro', 't3.small', 'm5.large', ...]
  },
  instance_count: {
    required: true,
    type: 'integer',
    min: 1,
    max: 100,
    conditional: {
      if_environment_type_single: { max: 1 },
      if_environment_type_load_balanced: { min: 2 }
    }
  },
  storage_gb: {
    required: true,
    type: 'integer',
    min: 1,
    max: 16000,
    default: 30
  },
  min_instances: {
    type: 'integer',
    min: 1,
    max: 100,
    requires: 'enable_auto_scaling = true'
  },
  max_instances: {
    type: 'integer',
    min: 1,
    max: 100,
    must_be: '>= min_instances'
  },
  target_cpu_utilization: {
    type: 'integer',
    min: 10,
    max: 100,
    default: 70
  },
  data_transfer_gb: {
    type: 'integer',
    min: 0,
    max: 1000000
  }
};
```

### Warning Conditions
1. **Single Instance Production**: Show warning when environment_type = "single"
   - Message: "⚠️ Single instance is not recommended for production. Use load-balanced for high availability."

2. **No Load Balancer (Multi-instance)**: Show warning when instance_count > 1 AND enable_load_balancer = false
   - Message: "⚠️ Load balancer recommended when running 2+ instances for traffic distribution"

3. **Overpowered Instance**: Show info when instance_type = "r5.xlarge" or higher
   - Message: "💡 This is a high-performance instance. Ensure workload justifies the cost."

4. **Auto-Scaling without Load Balancer**: Show warning
   - Message: "⚠️ Auto-scaling works best with a load balancer"

5. **Large Storage**: Show info when storage_gb > 500
   - Message: "💡 Consider EBS-optimized instances for better performance with large volumes"

6. **Free Tier Ineligible**: Show info message
   - Condition: enable_free_tier = true && instance_type != "t2.micro"
   - Message: "ℹ️ Free tier only applies to t2.micro. Switch to t2.micro to qualify."

---

## UI Behavior

### On Environment Type Change
1. If changing to "single":
   - Force instance_count = 1, disable ALB and auto-scaling
   - Hide load balancer section
   - Recalculate estimate
2. If changing to "load_balanced":
   - Set instance_count = 2 (minimum for HA)
   - Show load balancer section
   - Enable load balancer by default
   - Recalculate estimate

### On Instance Type Change
1. Update "hourly rate" display
2. Show instance specs (vCPU, memory) inline
3. Recalculate estimate if auto-calculate enabled
4. Check free tier eligibility (if currently eligible, may become ineligible)

### On Instance Count Change
1. Validate constraints (¥≥ 2 for load balanced, = 1 for single)
2. Recalculate instance cost
3. Update estimate

### On Load Balancer Toggle
1. Show/hide cross-zone, LCU configuration
2. Recalculate ALB cost
3. Update total

### On Auto-Scaling Toggle
1. Show/hide min/max instances, target CPU
2. Add/remove $0.04 policy cost
3. Show warning about requiring load balancer
4. Recalculate total

### Calculate Button
1. Validate all inputs against rules
2. Show loading state
3. Call API: POST /api/elastic-beanstalk/calculate
4. Display results in breakdown
5. Highlight any free tier savings
6. Show component-level costs with "Info" tooltips

### Reset Button
1. Reset all inputs to defaults
2. Clear calculated results
3. Do NOT automatically recalculate

---

## Error Handling

### API Errors
```javascript
const errorMessages = {
  400: "Invalid input parameters. Please check your configuration.",
  401: "Authentication required. Please log in.",
  404: "Pricing data unavailable for this region.",
  500: "Server error calculating pricing. Try again in a moment.",
  network: "Network error. Please check your connection and try again."
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

### Validation Error Display
```
Field "Instance Count" is invalid:
  Requires minimum 2 instances for load-balanced deployment
  [Fix: Change to single instance OR increase count to 2]
```

---

## Responsive Design Notes

### Mobile (< 768px)
- Stack all sections vertically
- Full-width inputs
- Instance type dropdown shows abbreviated info (type + vCPU only)
- Breakdown in collapsible accordion
- Sticky Calculate button at bottom

### Tablet (768px - 1024px)
- Two-column layout for some field groups
- Side-by-side radio buttons for environment type
- Dropdown menu shows full instance specs

### Desktop (> 1024px)
- Full layout as shown in UI Layout section
- Inline tooltips on hover
- Hover states for interactive elements
- Instance type dropdown shows full specs inline

---

## Accessibility

1. **Labels:** All inputs have associated descriptions
2. **ARIA:** Use aria-describedby for hints and notes
3. **Keyboard:** Full keyboard navigation support
4. **Screen Readers:** Announce cost updates, free tier eligibility
5. **Color:** Don't rely solely on color (use icons ℹ️, ⚠️)
6. **Focus:** Visible focus indicators on all inputs

---

## Frontend Implementation Checklist

- [ ] Create region dropdown with 11 regions
- [ ] Implement environment type radio buttons with conditional display
- [ ] Create instance type searchable dropdown with 20+ types grouped by family
- [ ] Add instance count input with validation
- [ ] Create collapsible load balancer section (hide/show based on environment type)
- [ ] Create collapsible storage & monitoring section
- [ ] Add auto-scaling configuration with min/max/target inputs
- [ ] Implement free tier checkbox with eligibility display
- [ ] Create cost breakdown display with component itemization
- [ ] Add Calculate, Reset, Add to Estimate buttons
- [ ] Implement form validation and warning/info messages
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Add accessibility features (ARIA, keyboard nav)
- [ ] Integration with backend API endpoints
- [ ] Connect to Zustand store for state management
