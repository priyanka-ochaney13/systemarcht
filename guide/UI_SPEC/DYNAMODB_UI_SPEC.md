# Amazon DynamoDB - Frontend UI Specification

## Overview
This document defines the exact UI behavior and backend integration for the Amazon DynamoDB pricing calculator.

---

## UI Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📊 Amazon DynamoDB Configuration                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📍 Region
   [us-east-1 ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 TABLE STORAGE CONFIGURATION

   Average Table Storage Size
   ┌─────────────────────────────────────────────┐
   │  100                                        │
   └─────────────────────────────────────────────┘
   GB per month
   💡 Billed based on average daily storage size

   ────────────────────────────────────────────────────────

   Average Item Size
   ┌─────────────────────────────────────────────┐
   │  4.0                                        │
   └─────────────────────────────────────────────┘
   KB
   💡 Used to calculate read/write unit consumption

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ CAPACITY MODE (Choose one)

   [ ] ON-DEMAND CAPACITY
       Perfect for: Unpredictable workloads, development/testing
       Pricing: Pay per request (no minimum charge)
       
       Read Requests per Month
       ┌─────────────────────────────────────────────┐
       │  100,000                                    │
       └─────────────────────────────────────────────┘
       requests
       💡 Each read unit = 4 KB of data
       
       ────────────────────────────────────────────────────────
       
       Write Requests per Month
       ┌─────────────────────────────────────────────┐
       │  50,000                                     │
       └─────────────────────────────────────────────┘
       requests
       💡 Each write unit = 1 KB of data

   ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄

   [ ] PROVISIONED CAPACITY
       Perfect for: Predictable, consistent workloads
       Pricing: Hourly rate for reserved capacity
       
       Read Capacity Units (RCUs)
       ┌─────────────────────────────────────────────┐
       │  100                                        │
       └─────────────────────────────────────────────┘
       RCU/second
       💡 1 RCU = 1 strongly consistent read of 4 KB item/second
          (2 RCU = 1 eventually consistent read)
       
       ────────────────────────────────────────────────────────
       
       Write Capacity Units (WCUs)
       ┌─────────────────────────────────────────────┐
       │  50                                         │
       └─────────────────────────────────────────────┘
       WCU/second
       💡 1 WCU = 1 write of 1 KB item/second

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 BACKUP & DATA PROTECTION

   [ ] Enable Backup Features
   
       ┌─────────────────────────────────────────┐
       │ Point-In-Time Recovery (PITR)           │
       ├─────────────────────────────────────────┤
       │ [ ] Enable PITR                         │
       │     Cost: % of table storage per month  │
       │     💡 Continuous backups for last 35d  │
       └─────────────────────────────────────────┘
       
       ────────────────────────────────────────────────────────
       
       ┌─────────────────────────────────────────┐
       │ On-Demand Backup Storage                │
       ├─────────────────────────────────────────┤
       │ Backup Storage Size                     │
       │ ┌──────────────────────────────────┐    │
       │ │  500                             │    │
       │ └──────────────────────────────────┘    │
       │ GB                                      │
       │ 💡 Data retained in manual backups      │
       └─────────────────────────────────────────┘
       
       ────────────────────────────────────────────────────────
       
       ┌─────────────────────────────────────────┐
       │ Restore Operations                      │
       ├─────────────────────────────────────────┤
       │ Data Size for Restore                   │
       │ ┌──────────────────────────────────┐    │
       │ │  100                             │    │
       │ └──────────────────────────────────┘    │
       │ GB                                      │
       │ 💡 One-time restore or test restore     │
       └─────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧮 COST BREAKDOWN

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Table Storage                              $25.00/month   │
│  On-Demand Read Cost                         $1.25/month   │
│  On-Demand Write Cost                        $0.63/month   │
│  Provisioned Read Cost                      $47.60/month   │
│  Provisioned Write Cost                     $23.80/month   │
│  PITR Backup Cost                           $15.00/month   │
│  Backup Storage Cost                         $5.00/month   │
│  Restore Cost                                 $1.00/month   │
│  ─────────────────────────────────────────────────────────  │
│  TOTAL MONTHLY COST                        $119.28/month   │
│                                             ≈ $1,431/year   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

💡 Cost Comparison Tips:
   • ON-DEMAND: Better for variable or unpredictable usage
   • PROVISIONED: Better for steady-state, predictable workloads
   • PITR: ~15% of table storage cost; recommended for production
   • Backup: Additional storage cost; keep old backups minimal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Section Details

### 1. Region Selection
- **Type**: Dropdown (Select)
- **Default**: `us-east-1`
- **Source**: `/dynamodb/regions` API endpoint
- **Behavior**: Updates available pricing when changed
- **Error Handling**: Shows error if region is invalid

### 2. Table Storage Configuration

#### Average Table Storage Size
- **Type**: Number input
- **Min**: 0 GB
- **Max**: No limit
- **Default**: 100 GB
- **Step**: 0.1
- **Validation**: Must be >= 0
- **Error Message**: "Storage must be non-negative"

#### Average Item Size
- **Type**: Number input
- **Min**: 0 KB
- **Max**: 400 KB (DynamoDB item size limit)
- **Default**: 4 KB
- **Step**: 0.1
- **Validation**: Must be >= 0
- **Error Message**: "Item size must be non-negative"

### 3. Capacity Mode Selection

#### On-Demand Capacity Toggle
- **Type**: Checkbox
- **Default**: Unchecked
- **Behavior**: Shows/hides On-Demand input fields when checked

**On-Demand Read Requests**
- **Type**: Number input
- **Min**: 0
- **Max**: Unlimited
- **Default**: 0
- **Step**: 1,000
- **Unit**: Requests per month
- **Validation**: Must be >= 0
- **Visible When**: On-Demand toggle is checked
- **Help Text**: "Each read unit = 4 KB of data"

**On-Demand Write Requests**
- **Type**: Number input
- **Min**: 0
- **Max**: Unlimited
- **Default**: 0
- **Step**: 1,000
- **Unit**: Requests per month
- **Validation**: Must be >= 0
- **Visible When**: On-Demand toggle is checked
- **Help Text**: "Each write unit = 1 KB of data"

#### Provisioned Capacity Toggle
- **Type**: Checkbox
- **Default**: Unchecked
- **Behavior**: Shows/hides Provisioned input fields when checked

**Provisioned Read Capacity Units (RCUs)**
- **Type**: Number input
- **Min**: 0 (can be set to 0 if on-demand is enabled)
- **Max**: 40,000 RCU
- **Default**: 0
- **Step**: 10
- **Unit**: RCU/second
- **Validation**: Must be >= 0
- **Visible When**: Provisioned toggle is checked
- **Help Text**: "1 RCU = 1 strongly consistent read of 4 KB item/second"

**Provisioned Write Capacity Units (WCUs)**
- **Type**: Number input
- **Min**: 0
- **Max**: 40,000 WCU
- **Default**: 0
- **Step**: 10
- **Unit**: WCU/second
- **Validation**: Must be >= 0
- **Visible When**: Provisioned toggle is checked
- **Help Text**: "1 WCU = 1 write of 1 KB item/second"

### 4. Backup & Data Protection

#### Enable Backup Features Toggle
- **Type**: Checkbox
- **Default**: Unchecked
- **Behavior**: Shows/hides backup fields when checked

#### Point-In-Time Recovery (PITR)
- **Type**: Checkbox
- **Default**: Unchecked
- **Visible When**: Backup toggle is checked
- **Help Text**: "Continuous backups for the last 35 days (~15% of table storage cost)"
- **Pricing**: Calculated as percentage of table storage

#### Backup Storage Size
- **Type**: Number input
- **Min**: 0 GB
- **Max**: No limit
- **Default**: 0
- **Step**: 10
- **Unit**: GB
- **Validation**: Must be >= 0
- **Visible When**: Backup toggle is checked
- **Help Text**: "Data retained in manual/on-demand backups"

#### Restore Data Size
- **Type**: Number input
- **Min**: 0 GB
- **Max**: No limit
- **Default**: 0
- **Step**: 10
- **Unit**: GB
- **Validation**: Must be >= 0
- **Visible When**: Backup toggle is checked
- **Help Text**: "One-time restore or test restore operation"

---

## API Integration

### Request Payload Structure
```json
{
  "region": "us-east-1",
  "storage_gb": 100,
  "avg_item_size_kb": 4.0,
  "on_demand_enabled": true,
  "on_demand_reads_per_month": 100000,
  "on_demand_writes_per_month": 50000,
  "provisioned_enabled": false,
  "provisioned_read_capacity_units": 0,
  "provisioned_write_capacity_units": 0,
  "backup_enabled": false,
  "pitr_enabled": false,
  "backup_storage_gb": 0,
  "restore_data_size_gb": 0
}
```

### Response Structure
```json
{
  "service": "dynamodb",
  "breakdown": {
    "storage_cost": 25.00,
    "on_demand_read_cost": 1.25,
    "on_demand_write_cost": 0.63,
    "provisioned_read_cost": 47.60,
    "provisioned_write_cost": 23.80,
    "pitr_cost": 15.00,
    "backup_storage_cost": 5.00,
    "restore_cost": 1.00,
    "total_cost": 119.28
  },
  "details": {
    "region": "us-east-1",
    "storage_gb": 100,
    "features": {
      "on_demand": true,
      "provisioned": false,
      "backup": false
    }
  }
}
```

### Error Responses
```json
{
  "detail": "Invalid region 'invalid-region'. Available regions: us-east-1, us-west-2, eu-west-1..."
}
```

Status Codes:
- **400 Bad Request**: Invalid input (negative values, invalid region)
- **500 Internal Server Error**: Server-side calculation error

---

## User Interactions & Workflows

### Workflow 1: Simple On-Demand Setup
1. Select region (default: us-east-1)
2. Enter storage size (100 GB)
3. Check "Enable On-Demand Capacity"
4. Enter read/write requests
5. View cost breakdown
6. **Cost components**: Storage + On-Demand reads/writes

### Workflow 2: Production Provisioned Setup
1. Select region
2. Enter storage size
3. Check "Enable Provisioned Capacity"
4. Enter RCU and WCU values
5. Check "Enable Backup Features"
6. Enable PITR
7. View total monthly cost
8. **Cost components**: Storage + Provisioned RCU/WCU + PITR

### Workflow 3: Compare Capacity Modes
1. Enable both "On-Demand" and "Provisioned" toggles
2. Enter typical usage patterns for both
3. Compare cost breakdown
4. **Use Case**: Determine best capacity mode for workload

### Workflow 4: Disaster Recovery Planning
1. Configure main table (On-Demand or Provisioned)
2. Check "Enable Backup Features"
3. Enable PITR
4. Enter backup storage size
5. Enter restore data size
6. View backup costs separately in breakdown

---

## Validation Rules

| Field | Min | Max | Default | Required | Error Message |
|-------|-----|-----|---------|----------|---------------|
| Region | - | - | us-east-1 | Yes | Invalid region |
| Storage GB | 0 | ∞ | 100 | Yes | storage_gb must be non-negative |
| Item Size KB | 0 | 400 | 4.0 | Yes | avg_item_size_kb must be non-negative |
| Read Requests | 0 | ∞ | 0 | (if On-Demand) | on_demand_reads_per_month must be non-negative |
| Write Requests | 0 | ∞ | 0 | (if On-Demand) | on_demand_writes_per_month must be non-negative |
| Read Capacity | 0 | 40,000 | 0 | (if Provisioned) | provisioned_read_capacity_units must be non-negative |
| Write Capacity | 0 | 40,000 | 0 | (if Provisioned) | provisioned_write_capacity_units must be non-negative |
| Backup Storage | 0 | ∞ | 0 | (if Backup) | backup_storage_gb must be non-negative |
| Restore Size | 0 | ∞ | 0 | (if Backup) | restore_data_size_gb must be non-negative |

---

## Visual States

### Default State
- All inputs visible
- Checkboxes unchecked (except storage which is always visible)
- Cost breakdown shows $0.00 for all components
- Region dropdown shows `us-east-1`

### On-Demand Enabled State
- On-demand fields become visible
- Reads/Writes per month inputs are required
- Cost breakdown updates with on-demand costs

### Provisioned Enabled State
- Provisioned capacity fields become visible
- RCU/WCU inputs are required
- Cost breakdown updates with provisioned hourly costs

### Backup Enabled State
- PITR toggle, backup storage, restore size fields visible
- If PITR checked: pitr_cost calculated
- If backup storage > 0: backup_storage_cost calculated
- If restore size > 0: restore_cost calculated

### Error State
- Input field border turns red
- Error message displays below field
- API request is blocked
- Submit button is disabled

---

## Recommendations & Tooltips

### When to Use On-Demand
> "Choose On-Demand if your workload is unpredictable, has traffic spikes, or you're in development/testing phase."

### When to Use Provisioned
> "Choose Provisioned if you have consistent, predictable traffic. You can save 40-50% with Provisioned vs On-Demand."

### PITR Best Practice
> "Enable PITR for production tables. Cost is ~15% of table storage and provides recovery for the last 35 days."

### Item Size Impact
> "The average item size affects how many read/write units are consumed. Larger items consume more capacity."

---

## Responsive Design

### Desktop (> 1024px)
- Two-column layout: inputs on left, cost breakdown on right
- All fields visible simultaneously
- Cost breakdown is sticky (scrolls with page)

### Tablet (768px - 1024px)
- Single-column layout
- Cost breakdown below inputs
- Toggleable sections (On-Demand, Provisioned, Backup)

### Mobile (< 768px)
- Full-width single column
- Expandable/collapsible sections for each feature
- Cost breakdown always at bottom
- Sticky calculate button

---

## Accessibility

- All inputs have associated labels
- Form fields support keyboard navigation
- Error messages are announced to screen readers
- Tooltips available via `<abbr>` tag or `?` icon
- Color coding supplemented by text (not color-only)
- Sufficient contrast ratio (WCAG AA minimum)

---

## Performance Considerations

- **Debounce**: Input changes debounced by 300ms before API call
- **Caching**: Region list cached for 1 hour
- **Validation**: Client-side validation before API submission
- **Loading State**: Show spinner during API request (< 1s expected)

---

## Future Enhancements

1. **Usage Patterns**: Presets for common workloads (mobile app, SaaS, IoT)
2. **Capacity Calculator**: Auto-suggest RCU/WCU based on throughput requirements
3. **Cost Trends**: Show month-over-month cost projections
4. **Comparison**: Side-by-side cost comparison with other AWS databases
5. **Exports**: Download cost estimate as PDF or CSV
6. **Multi-Region**: Calculate costs for global tables with replication
