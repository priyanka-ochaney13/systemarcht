# AWS Pricing Formulas - Backend Calculation Reference

## Base Pricing Tier Model
**Tiered Pricing Calculation:**
```
total_cost = 0
remaining = quantity

For each tier:
  tier_size = tier.end_range - tier.begin_range
  quantity_in_tier = min(remaining, tier_size)
  cost_in_tier = quantity_in_tier × tier.price_per_unit
  total_cost += cost_in_tier
  remaining -= quantity_in_tier
```

---

## S3 (Simple Storage Service)

### 1. Storage Cost Formula
```
storage_cost = storage_gb × rate_per_gb
```
- **Parameters:** storage_gb, storage_class (standard, intelligent_tiering, standard_ia, one_zone_ia, glacier_instant, glacier_flexible, deep_archive)
- **Rate Source:** Retrieved from pricing tiers based on region and storage class

### 2. Request Cost Formula
```
put_cost = put_requests × rate_per_put_request
get_cost = get_requests × rate_per_get_request
delete_cost = delete_requests × rate_per_delete_request

request_cost = put_cost + get_cost + delete_cost
```
- **Note:** Pricing rates are stored per 1000 requests, then converted to per-request by dividing by 1000

### 3. Data Transfer Cost Formula
```
outbound_cost = outbound_transfer_gb × outbound_rate_per_gb
intra_region_cost = intra_region_transfer_gb × intra_region_rate_per_gb

transfer_cost = outbound_cost + intra_region_cost
```

### 4. Total S3 Cost
```
total_cost = storage_cost + request_cost + transfer_cost
```

---

## Lambda

### 1. Request Cost Formula
```
free_tier_requests = 1,000,000 if include_free_tier else 0
billable_requests = max(0, total_requests - free_tier_requests)
requests_cost = billable_requests × request_rate_per_request
```

### 2. Compute (Duration) Cost Formula
```
duration_seconds = duration_ms / 1000
memory_gb = memory_mb / 1024
total_gb_seconds = requests × duration_seconds × memory_gb

free_tier_gb_seconds = 400,000 if include_free_tier else 0
billable_gb_seconds = max(0, total_gb_seconds - free_tier_gb_seconds)

compute_cost = billable_gb_seconds × duration_rate_per_gb_second
```

### 3. Ephemeral Storage Cost Formula
```
free_storage_mb = 512
additional_storage_mb = max(0, storage_mb - free_storage_mb)
additional_storage_gb = additional_storage_mb / 1024

storage_gb_seconds = requests × duration_seconds × additional_storage_gb
storage_cost = storage_gb_seconds × storage_rate_per_gb_second
```

### 4. Provisioned Concurrency Cost Formula
```
If provisioned_concurrency > 0:
  provisioned_gb_seconds = provisioned_concurrency × memory_gb × seconds_per_month (730 * 3600)
  provisioned_cost = provisioned_gb_seconds × provisioned_rate_per_gb_second
Else:
  provisioned_cost = 0
```

### 5. Free Tier Savings Calculation
```
saved_requests = min(requests, 1,000,000)
saved_gb_seconds = min(total_gb_seconds, 400,000)

free_tier_savings = (saved_requests × request_rate) + (saved_gb_seconds × duration_rate)
```

### 6. Total Lambda Cost
```
total_cost = requests_cost + compute_cost + storage_cost + provisioned_cost
```

---

## DynamoDB

### 1. Storage Cost Formula
```
storage_cost = apply_tiered_pricing(storage_gb, storage_tiers)
```

### 2. On-Demand Read Cost Formula
```
read_units_per_request = ceil(avg_item_size_kb / 4)
total_read_units = on_demand_reads_per_month × read_units_per_request

on_demand_read_cost = apply_tiered_pricing(total_read_units, read_tiers)
```

### 3. On-Demand Write Cost Formula
```
write_units_per_request = ceil(avg_item_size_kb / 1)
total_write_units = on_demand_writes_per_month × write_units_per_request

on_demand_write_cost = apply_tiered_pricing(total_write_units, write_tiers)
```

### 4. Provisioned Read Cost Formula
```
hours_per_month = 730
total_rcu_hours = provisioned_read_capacity_units × 730

provisioned_read_cost = apply_tiered_pricing(total_rcu_hours, read_tiers)
```

### 5. Provisioned Write Cost Formula
```
hours_per_month = 730
total_wcu_hours = provisioned_write_capacity_units × 730

provisioned_write_cost = apply_tiered_pricing(total_wcu_hours, write_tiers)
```

### 6. Backup Costs
**PITR (Point-in-Time Recovery) Cost:**
```
pitr_cost = apply_tiered_pricing(storage_gb, pitr_tiers)
```

**Backup Storage Cost:**
```
backup_storage_cost = apply_tiered_pricing(backup_storage_gb, backup_tiers)
```

**Restore Cost:**
```
restore_cost = apply_tiered_pricing(restore_data_size_gb, restore_tiers)
```

### 7. Total DynamoDB Cost
```
total_cost = storage_cost 
           + on_demand_read_cost 
           + on_demand_write_cost 
           + provisioned_read_cost 
           + provisioned_write_cost 
           + pitr_cost 
           + backup_storage_cost 
           + restore_cost
```

---

## API Gateway

### 1. HTTP API Cost Formula
```
request_chunk_size = 0.5 KB
response_chunk_size = 0.5 KB

request_chunks = ceil(request_kb / request_chunk_size)
response_chunks = ceil(response_kb / response_chunk_size)

billable_per_request = request_chunks + response_chunks
total_billable = requests × billable_per_request

cost = apply_tiered_pricing(total_billable, pricing_tiers)
```

### 2. REST API Cost Formula
```
cost = apply_tiered_pricing(requests, pricing_tiers)
```

### 3. WebSocket Message Cost Formula
```
message_chunk_size = 32 KB
chunks_per_message = ceil(message_kb / message_chunk_size)
total_billable_messages = messages × chunks_per_message

message_cost = apply_tiered_pricing(total_billable_messages, message_tiers)
```

### 4. WebSocket Connection Cost Formula
```
connection_cost = apply_tiered_pricing(connection_minutes, minute_tiers)
```

### 5. Cache Cost Formula
```
hourly_rate = price_per_unit (based on cache_size_gb)
monthly_cost = hourly_rate × 730 hours
```

---

## Elastic Load Balancer (ELB)

### Application Load Balancer (ALB)
```
hourly_cost = hours_per_month × alb_hourly_rate
lcu_used_hours = lcu_per_hour × hours_per_month
lcu_cost = lcu_used_hours × lcu_used_rate_per_hour

lcu_reserved_hours = reserved_lcu_per_hour × hours_per_month
reserved_lcu_cost = lcu_reserved_hours × lcu_reserved_rate_per_hour

trust_store_cost = trust_store_hours × trust_store_rate_per_hour

total_alb_cost = hourly_cost + lcu_cost + reserved_lcu_cost + trust_store_cost
```

### Network Load Balancer (NLB)
```
hourly_cost = hours_per_month × nlb_hourly_rate
lcu_used_hours = lcu_per_hour × hours_per_month
lcu_cost = lcu_used_hours × lcu_used_rate_per_hour

lcu_reserved_hours = reserved_lcu_per_hour × hours_per_month
reserved_lcu_cost = lcu_reserved_hours × lcu_reserved_rate_per_hour

total_nlb_cost = hourly_cost + lcu_cost + reserved_lcu_cost
```

### Gateway Load Balancer (GWLB)
```
hourly_cost = hours_per_month × gwlb_hourly_rate
lcu_used_hours = lcu_per_hour × hours_per_month
lcu_cost = lcu_used_hours × lcu_used_rate_per_hour

lcu_reserved_hours = reserved_lcu_per_hour × hours_per_month
reserved_lcu_cost = lcu_reserved_hours × lcu_reserved_rate_per_hour

total_gwlb_cost = hourly_cost + lcu_cost + reserved_lcu_cost
```

### Classic Load Balancer (CLB)
```
hourly_cost = hours_per_month × clb_hourly_rate
data_cost = data_processed_gb × clb_data_rate_per_gb

total_clb_cost = hourly_cost + data_cost
```

---

## Elastic Beanstalk

### 1. EC2 Instance Cost Formula
```
hourly_rate = price_per_instance_per_hour
total_monthly_hours = instance_count × 730 hours

free_tier_hours = 750 if free_tier_eligible and include_free_tier else 0
billable_hours = max(0, total_monthly_hours - free_tier_hours)

ec2_cost = billable_hours × hourly_rate
```

### 2. Application Load Balancer Cost Formula
```
monthly_hours = 730
alb_cost = alb_hourly_rate × monthly_hours

estimated_lcu = max(2.0, instance_count / 2)
lcu_cost = estimated_lcu × alb_lcu_hourly_rate × monthly_hours

cross_zone_cost = 0
If cross_zone_enabled:
  cross_zone_cost = cross_zone_hourly_rate × monthly_hours

total_alb_cost = alb_cost + lcu_cost + cross_zone_cost
```

### 3. EBS Storage Cost Formula
```
free_storage_gb = 30 if free_tier_applied else 0
billable_storage_gb = max(0, storage_gb - free_storage_gb)

storage_cost = billable_storage_gb × ebs_storage_rate_per_gb_month
```
- Storage rates vary by volume type (gp2: $0.10/GB, io1: $0.125/GB, etc.)

### 4. Monitoring Cost Formula
```
If enhanced_monitoring_enabled:
  monitoring_cost = instance_count × enhanced_monitoring_rate_per_instance_month
Else:
  monitoring_cost = 0
```

### 5. Data Transfer Cost Formula
```
free_transfer_gb = 1
billable_transfer_gb = max(0, data_transfer_gb - free_transfer_gb)

data_transfer_cost = billable_transfer_gb × transfer_rate_per_gb
```

### 6. Auto-Scaling Cost Formula
```
If auto_scaling_enabled:
  auto_scaling_cost = auto_scaling_policy_rate_per_month
Else:
  auto_scaling_cost = 0
```

### 7. Total Elastic Beanstalk Cost
```
total_cost = ec2_cost 
           + total_alb_cost 
           + storage_cost 
           + monitoring_cost 
           + data_transfer_cost 
           + auto_scaling_cost
```

---

## Cognito

### 1. Monthly Active Users (MAU) Cost Formula
```
free_mau = 50,000
billable_mau = max(0, mau - free_mau)

mau_cost = billable_mau × mau_rate_per_user
```

### 2. SMS MFA Cost Formula
```
If mfa_enabled and mfa_type == "sms":
  mfa_users = mau × (mfa_percentage / 100)
  sms_mfa_cost = mfa_users × sms_mfa_rate_per_user
Else:
  sms_mfa_cost = 0
```
- **Note:** Authenticator and TOTP MFA are free

### 3. Advanced Security Cost Formula
```
If advanced_security_enabled:
  free_evaluations = 50,000
  billable_evaluations = max(0, risk_evaluated_logins - free_evaluations)
  
  advanced_security_cost = billable_evaluations × advanced_security_rate_per_evaluation
Else:
  advanced_security_cost = 0
```

### 4. Custom Domain Cost Formula
```
If custom_domain_enabled:
  custom_domain_cost = custom_domain_rate_per_month
Else:
  custom_domain_cost = 0
```

### 5. Email Customization Cost Formula
```
If email_customization_enabled:
  email_customization_cost = monthly_emails × email_rate_per_1000_emails / 1000
Else:
  email_customization_cost = 0
```

### 6. Free Tier Savings (Informational)
```
free_tier_savings = (50,000 × mau_rate) + (50,000 × advanced_security_rate)
```

### 7. Total Cognito Cost
```
total_cost = mau_cost 
           + sms_mfa_cost 
           + advanced_security_cost 
           + custom_domain_cost 
           + email_customization_cost
```

---

## Key Constants & Multipliers

| Constant | Value | Usage |
|----------|-------|-------|
| SECONDS_PER_MONTH | 2,592,000 | Lambda provisioned concurrency |
| HOURS_PER_MONTH | 730 | ELB, Elastic Beanstalk, DynamoDB provisioned |
| LAMBDA_FREE_TIER_REQUESTS | 1,000,000 | Lambda monthly free requests |
| LAMBDA_FREE_TIER_GB_SECONDS | 400,000 | Lambda free compute |
| LAMBDA_STORAGE_FREE_MB | 512 | Lambda free ephemeral storage |
| DYNAMODB_RCU_SIZE | 4 KB | DynamoDB on-demand read unit |
| DYNAMODB_WCU_SIZE | 1 KB | DynamoDB on-demand write unit |
| HTTP_API_REQUEST_CHUNK | 0.5 KB | API Gateway request charging unit |
| HTTP_API_RESPONSE_CHUNK | 0.5 KB | API Gateway response charging unit |
| WEBSOCKET_MESSAGE_CHUNK | 32 KB | API Gateway WebSocket message unit |
| COGNITO_FREE_MAU | 50,000 | Cognito free monthly active users |
| COGNITO_FREE_SECURITY_EVALS | 50,000 | Cognito free advanced security evaluations |

---

## Rounding
All final cost calculations are **rounded to 2 decimal places** using standard rounding.

## Free Tier Application
- Free tiers are applied by subtracting from total quantity before applying pricing
- The `include_free_tier` flag controls whether free tier benefits are included
- Free tier eligibility varies by service and configuration
