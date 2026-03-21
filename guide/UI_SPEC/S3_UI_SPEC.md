# Amazon S3 - Frontend UI Specification

## Overview
This document defines the exact UI behavior and backend integration for the Amazon S3 pricing calculator.

---

## UI Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🪣 Amazon S3 Configuration                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📍 Region
   [Asia Pacific (Mumbai) ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 STORAGE CLASS (Choose one)

   (•) S3 Standard           - General purpose, immediate access
       Cost: High storage, low access cost
   
   ( ) S3 Intelligent-Tiering   - Auto cost optimization
       💡 Recommended for variable workloads
   
   ( ) S3 Standard-IA        - Infrequent access, 30-day minimum
       Cost: Low storage, high access cost
   
   ( ) S3 One Zone-IA        - Single AZ, 30-day minimum
       Cost: Lowest storage, similar access cost
   
   ( ) S3 Glacier Instant    - Archive with instant retrieval
   
   ( ) S3 Glacier Flexible   - Archive with flexible retrieval (3-5 hrs)
   
   ( ) S3 Deep Archive       - Long-term archive (12 hrs retrieval)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 STORAGE CONFIGURATION

   Average Storage Size
   ┌─────────────────────────────────────────────┐
   │  100                                        │
   └─────────────────────────────────────────────┘
   GB per month
   💡 Billed based on average daily storage within the month

   ────────────────────────────────────────────────────────

   Number of PUT Requests
   ┌─────────────────────────────────────────────┐
   │  10,000                                     │
   └─────────────────────────────────────────────┘
   requests per month
   💡 Write operations (uploads, copies)

   ────────────────────────────────────────────────────────

   Number of GET Requests
   ┌─────────────────────────────────────────────┐
   │  100,000                                    │
   └─────────────────────────────────────────────┘
   requests per month
   💡 Read operations (downloads, listings)

   ────────────────────────────────────────────────────────

   Number of DELETE Requests
   ┌─────────────────────────────────────────────┐
   │  1,000                                      │
   └─────────────────────────────────────────────┘
   requests per month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 DATA TRANSFER

   Outbound Data Transfer (Internet)
   ┌─────────────────────────────────────────────┐
   │  50                                         │
   └─────────────────────────────────────────────┘
   GB per month
   💡 Data leaving AWS to the internet (charged)
   ⚠️  First 1 GB/month FREE every month

   ────────────────────────────────────────────────────────

   CloudFront Integration
   [ ] Enable CloudFront for distribution
   
   💡 Use CloudFront to reduce data transfer costs
      (CloudFront pricing calculated separately)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ ADVANCED OPTIONS (Collapsible)

   Intelligent-Tiering Configuration (if selected)
   ┌──────────────────────────────────────────┐
   │  🔄 Automatic tier transitions            │
   │                                           │
   │  Frequent Access: $0.023/GB (0-30 days)  │
   │  Infrequent Access: $0.0125/GB (30+ days)│
   │  Archive Access: $0.004/GB (90+ days)    │
   │  Deep Access: $0.3/100k (180+ days)      │
   │                                           │
   │  Monitoring: $0.0025/1k objects           │
   └──────────────────────────────────────────┘

   ────────────────────────────────────────────────────────

   Cross-Region Replication
   [ ] Enable Cross-Region Replication
   
   Replication Destination Region (if enabled)
   [Select Region ▼]
   
   Replicated Data Size
   ┌─────────────────────────────────────────────┐
   │  0                                          │
   └─────────────────────────────────────────────┘
   GB per month
   
   💡 You can replicate to reduce latency or disaster recovery

   ────────────────────────────────────────────────────────

   Lifecycle Policy Rule Count
   [  1  ▼] rules
   
   💡 Transitions to other storage classes (included example)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ESTIMATED MONTHLY COST

   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │  📋 COST BREAKDOWN                                      │
   │  ─────────────────────────────────────────────────────  │
   │                                                         │
   │  Storage                                                │
   │    Size: 100 GB                                         │
   │    Rate: $0.023/GB (S3 Standard)                        │
   │    Cost:                               $2.30            │
   │                                                         │
   │  Requests                                               │
   │    PUT Requests: 10,000 × $0.005/1k    $0.05            │
   │    GET Requests: 100,000 × $0.0004/1k  $0.04            │
   │    DELETE: 1,000 × $0.0004/1k          $0.00            │
   │    Cost:                               $0.09            │
   │                                                         │
   │  Data Transfer                                          │
   │    Outbound: 50 GB (- 1 GB free)       $0.00            │
   │    (First 1 GB free, then $0.09/GB)                    │
   │    Cost:                               $0.00            │
   │                                                         │
   │  Data Retrieval & Replication                           │
   │    Cost:                               $0.00            │
   │                                                         │
   │  ─────────────────────────────────────────────────────  │
   │                                                         │
   │  SUBTOTAL:                             $2.39            │
   │                                                         │
   │  ═══════════════════════════════════════════════════    │
   │  TOTAL:                           $2.39/month           │
   │  ═══════════════════════════════════════════════════    │
   │                                                         │
   └─────────────────────────────────────────────────────────┘
   
   [  Calculate  ]     [  Reset  ]     [  Add to Estimate  ]
```

---

## Field Visibility Rules

### Universal Fields (Always Visible)
- Region dropdown
- Storage Class selector
- Average Storage Size
- PUT Requests count
- GET Requests count
- DELETE Requests count
- Outbound Data Transfer
- CloudFront checkbox

### When **S3 Standard** is selected:
**Show:**
- Storage cost: $0.023/GB
- Simple request pricing

**Hide:**
- Retrieval costs (minimal)

**Cost Components:**
- Storage: $ X.XX
- Requests: $ X.XX
- Data Transfer: $ X.XX

---

### When **S3 Intelligent-Tiering** is selected:
**Show:**
- Monitoring cost: $0.0025/1k objects
- Tiered storage explanation box
- Transition between tiers (automatic)

**Cost Components:**
- Storage (variable tiers): $ X.XX
- Monitoring: $ X.XX
- Requests: $ X.XX
- Data Transfer: $ X.XX

---

### When **S3 Standard-IA** is selected:
**Show:**
- Data retrieval cost: $0.01/GB
- Minimum storage duration warning (30 days)
- Early deletion fee warning

**Cost Components:**
- Storage: $ X.XX
- Requests & Retrieval: $ X.XX
- Data Transfer: $ X.XX

---

### When **S3 One Zone-IA** is selected:
**Show:**
- Data retrieval cost: $0.01/GB
- Single AZ warning (no redundancy)
- Minimum storage duration warning (30 days)

**Cost Components:**
- Storage: $ X.XX
- Requests & Retrieval: $ X.XX
- Data Transfer: $ X.XX

---

### When **S3 Glacier Instant**, **S3 Glacier Flexible**, or **S3 Deep Archive** is selected:
**Show:**
- Data retrieval cost
- Retrieval time expectations
- Minimum storage duration warning

**Cost Components:**
- Storage: $ X.XX
- Retrieval: $ X.XX
- Data Transfer: $ X.XX

---

## Field Specifications

### 1. Region Dropdown
- **Label:** "📍 Region"
- **Type:** Dropdown (searchable)
- **Default:** Asia Pacific (Mumbai)
- **Required:** Yes
- **Options:** All AWS regions where S3 is available
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

### 2. Storage Class Radio Buttons
- **Label:** "📦 STORAGE CLASS"
- **Type:** Radio buttons (7 options)
- **Default:** S3 Standard
- **Required:** Yes
- **Options:**
  | Display Text | Value | Description |
  |--------------|-------|-------------|
  | S3 Standard | `STANDARD` | General purpose, immediate access |
  | S3 Intelligent-Tiering | `INTELLIGENT_TIERING` | Auto cost optimization |
  | S3 Standard-IA | `STANDARD_IA` | Infrequent access, 30-day minimum |
  | S3 One Zone-IA | `ONE_ZONE_IA` | Single AZ, 30-day minimum |
  | S3 Glacier Instant | `GLACIER_IR` | Archive with instant retrieval |
  | S3 Glacier Flexible | `GLACIER` | Archive with flexible retrieval |
  | S3 Deep Archive | `DEEP_ARCHIVE` | Long-term archive |

### 3. Average Storage Size
- **Label:** "Average Storage Size"
- **Type:** Number input
- **Default:** 100
- **Min:** 0.001
- **Max:** 1000000
- **Unit Display:** "GB per month"
- **Tooltip:** "Based on average daily storage within the month"

### 4. Number of PUT Requests
- **Label:** "Number of PUT Requests"
- **Type:** Number input
- **Default:** 10000
- **Min:** 0
- **Unit Display:** "requests per month"
- **Tooltip:** "Upload, copy, and other write operations"

### 5. Number of GET Requests
- **Label:** "Number of GET Requests"
- **Type:** Number input
- **Default:** 100000
- **Min:** 0
- **Unit Display:** "requests per month"
- **Tooltip:** "Download, list, and other read operations"

### 6. Number of DELETE Requests
- **Label:** "Number of DELETE Requests"
- **Type:** Number input
- **Default:** 1000
- **Min:** 0
- **Unit Display:** "requests per month"

### 7. Outbound Data Transfer
- **Label:** "Outbound Data Transfer (Internet)"
- **Type:** Number input
- **Default:** 50
- **Min:** 0
- **Unit Display:** "GB per month"
- **Tooltip:** "Data leaving AWS to the internet. First 1 GB/month FREE"

### 8. CloudFront Integration
- **Label:** "Enable CloudFront for distribution"
- **Type:** Checkbox
- **Default:** Unchecked
- **Impact:** Shows separate CloudFront cost estimation note
- **Tooltip:** "CloudFront can reduce data transfer costs by up to 50%"

### 9. Intelligent-Tiering Monitoring
- **Label:** "Monitoring objects count"
- **Type:** Number input (Intelligent-Tiering only)
- **Default:** 0 (calculated from storage size)
- **Min:** 0
- **Unit Display:** "objects"
- **Tooltip:** "Auto-calculated as ~10,000 objects per GB. Cost: $0.0025 per 1k objects"

### 10. Cross-Region Replication
- **Label:** "Enable Cross-Region Replication"
- **Type:** Checkbox
- **Default:** Unchecked
- **Advanced Option:** Yes
- **Conditional Fields:**
  - Replication Destination Region (dropdown, if enabled)
  - Replicated Data Size (number input, GB)

### 11. Lifecycle Transitions
- **Label:** "Lifecycle Policy Rule Count"
- **Type:** Dropdown
- **Default:** 1
- **Options:** 0, 1, 2, 3, 5, 10
- **Advanced Option:** Yes
- **Cost:** Transition requests typically $0.01 per 1k transitions

---

## Backend API Integration

### Endpoint
```
POST /api/s3/calculate
```

### Request Payload

```json
{
  "region": "ap-south-1",
  "storage_class": "STANDARD",
  "storage_size_gb": 100,
  "put_requests": 10000,
  "get_requests": 100000,
  "delete_requests": 1000,
  "outbound_transfer_gb": 50,
  "enable_cloudfront": false,
  "enable_replication": false,
  "replication_region": null,
  "replication_data_gb": 0,
  "lifecycle_rules": 1,
  "intelligent_tiering_objects": 0
}
```

### Response Format

```json
{
  "service": "s3",
  "region": "ap-south-1",
  "storage_class": "STANDARD",
  "breakdown": {
    "total_cost": 2.39,
    "storage_cost": 2.30,
    "request_cost": 0.09,
    "data_transfer_cost": 0.0,
    "retrieval_cost": 0.0,
    "replication_cost": 0.0,
    "cloudfront_note": "Not calculated"
  },
  "details": {
    "storage": {
      "size_gb": 100,
      "rate_per_gb": 0.023,
      "cost_usd": 2.30
    },
    "requests": {
      "put_requests": 10000,
      "put_cost": 0.05,
      "get_requests": 100000,
      "get_cost": 0.04,
      "delete_requests": 1000,
      "delete_cost": 0.0,
      "total_cost": 0.09
    },
    "data_transfer": {
      "outbound_gb": 50,
      "free_tier_gb": 1,
      "billable_gb": 49,
      "rate_per_gb": 0.09,
      "cost_usd": 0.0,
      "note": "First 1 GB/month free"
    },
    "retrieval": {
      "applicable": false,
      "cost_usd": 0.0
    }
  }
}
```

### Response Format (Intelligent-Tiering)

```json
{
  "service": "s3",
  "region": "ap-south-1",
  "storage_class": "INTELLIGENT_TIERING",
  "breakdown": {
    "total_cost": 2.50,
    "storage_cost": 2.30,
    "monitoring_cost": 0.20,
    "request_cost": 0.09,
    "data_transfer_cost": 0.0
  },
  "details": {
    "storage": {
      "frequent_tier_gb": 100,
      "frequent_rate": 0.023,
      "cost_usd": 2.30,
      "note": "Estimated assuming all in frequent tier"
    },
    "monitoring": {
      "object_count": 10000,
      "rate_per_1k": 0.0025,
      "cost_usd": 0.20
    },
    "requests": {
      "total_cost": 0.09
    }
  }
}
```

### Response Format (Standard-IA / Glacier)

```json
{
  "service": "s3",
  "region": "ap-south-1",
  "storage_class": "STANDARD_IA",
  "breakdown": {
    "total_cost": 3.39,
    "storage_cost": 1.30,
    "request_cost": 0.09,
    "retrieval_cost": 2.0,
    "data_transfer_cost": 0.0
  },
  "details": {
    "storage": {
      "size_gb": 100,
      "rate_per_gb": 0.0125,
      "cost_usd": 1.30,
      "minimum_duration_days": 30
    },
    "requests": {
      "total_cost": 0.09
    },
    "retrieval": {
      "data_gb": 100,
      "rate_per_gb": 0.01,
      "cost_usd": 1.0,
      "note": "Retrieving entire dataset"
    }
  }
}
```

---

## Frontend Implementation Checklist

- [ ] Create region dropdown with display names
- [ ] Add region name to code mapping
- [ ] Create storage class radio buttons (7 options)
- [ ] Add storage class display to code mapping
- [ ] Implement conditional field visibility logic
- [ ] Show/hide fields based on storage class selection
- [ ] Add storage size, PUT/GET/DELETE request inputs
- [ ] Add outbound data transfer input
- [ ] Add CloudFront checkbox
- [ ] Add advanced section (collapsible)
- [ ] Implement Intelligent-Tiering monitoring cost
- [ ] Add Cross-Region Replication options
- [ ] Add lifecycle rules count dropdown
- [ ] Implement form validation
- [ ] Build request payload with proper mapping
- [ ] Call backend API endpoint
- [ ] Parse response and display cost breakdown
- [ ] Handle error responses
- [ ] Add loading state during calculation
- [ ] Format currency display ($X.XX)
- [ ] Show free tier information (1 GB outbound)
- [ ] Display minimum duration warnings (IA/Glacier classes)

---

## Pricing Rules & Notes

### Storage Pricing (varies by region)
- **S3 Standard:** $0.023/GB (US East)
- **S3 Intelligent-Tiering:** $0.023/GB (frequent) + monitoring
- **S3 Standard-IA:** $0.0125/GB
- **S3 One Zone-IA:** $0.01/GB
- **S3 Glacier Instant:** $0.004/GB
- **S3 Glacier Flexible:** $0.0036/GB
- **S3 Deep Archive:** $0.00099/GB

### Request Pricing (per 1,000 requests)
- **PUT/COPY:** $0.005
- **GET/SELECT/HEAD:** $0.0004
- **DELETE:** $0.0004
- **List:** $0.0005

### Data Transfer
- **Inbound:** Free
- **Outbound (Internet):** $0.09/GB (US East), with first 1 GB/month free
- **CloudFront Origin Shield:** Additional cost per request

### Retrieval Costs (IA, Glacier classes)
- **Standard-IA:** $0.01/GB retrieved
- **One Zone-IA:** $0.01/GB retrieved
- **Glacier Instant:** $0.01/GB retrieved
- **Glacier Flexible:** $0.03/GB retrieved (Standard)
- **Deep Archive:** $0.02/GB retrieved (Standard)

### Additional Costs
- **Intelligent-Tiering Monitoring:** $0.0025 per 1,000 objects (billed monthly)
- **Lifecycle Transitions:** $0.01 per 1,000 requests
- **Replication:** Charged as PUT requests + data transfer

---

## Pricing Variations by Region

Prices vary significantly by region. Examples:

| Region | Storage/GB | Outbound/GB |
|--------|-----------|------------|
| US East (N. Virginia) | $0.023 | $0.09 |
| EU (Ireland) | $0.024 | $0.09 |
| Asia Pacific (Mumbai) | $0.0265 | $0.12 |
| Asia Pacific (Sydney) | $0.0285 | $0.13 |

---

## Implementation Notes

1. **Storage Size Input:** Users enter actual size in GB (e.g., 100), not in TB
2. **Request Counts:** Per individual requests (e.g., 10000), not in thousands
3. **Free Tier:** Only 1 GB outbound transfer is free per month
4. **Data Retrieval:** Different from outbound transfer (IA/Glacier specific)
5. **Minimum Storage Duration:** IA classes impose 30-day minimum (charge for early deletion)
6. **Intelligent-Tiering:** Objects automatically move between tiers; frontend shows estimated cost
7. **Regional Prices:** Always fetch from pricing service for accurate region-specific rates
8. **CloudFront Integration:** Note that CloudFront pricing is separate; UI should indicate this

---

## Removed Features

The following features are **NOT** implemented:

❌ **Batch Operations** - Pricing is minimal and rarely cost-significant  
❌ **S3 Object Lambda** - Advanced feature, not in initial release  
❌ **S3 Access Points** - Regional pricing variant, minimal cost impact  
❌ **Storage Lens Analytics** - Monitoring only, not storage cost  
❌ **S3 Event Notifications** - Minimal cost, usually negligible  
❌ **S3 Inventory** - Optional reporting, not core pricing  
