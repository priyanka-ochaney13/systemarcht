# AWS Pricing Formula Reference

This document is the reference guide for the pricing logic used by SystemArcht. It covers the core calculation patterns and the AWS services currently modeled by the application.

The calculator reads pricing metadata from `backend/pricing_data/*.json`, applies service-specific formulas, and aggregates the result into a monthly estimate.

## General formula model

Most services follow the same broad pattern:

```text
service_cost = resource_quantity × unit_rate
monthly_total = sum(service_costs)
```

For tiered pricing, the model applies the quantity against each tier in order:

```text
total_cost = 0
remaining = quantity

for each tier in tiers:
    tier_quantity = min(remaining, tier.end - tier.begin)
    total_cost += tier_quantity × tier.price
    remaining -= tier_quantity
```

This approach is used for a number of AWS services where the first GB, first 1M requests, or first set of units are priced differently from larger usage bands.

## General conventions

- All monthly projections are treated as monthly totals unless otherwise specified.
- Free-tier logic is applied before the billable rate is charged.
- Final values are rounded to 2 decimal places for display.
- Prices are service-region aware and depend on the values stored in the pricing JSON files.

## S3

### Storage

```text
storage_cost = storage_gb × storage_rate_per_gb
```

### Requests

```text
request_cost = put_requests × put_rate
             + get_requests × get_rate
             + delete_requests × delete_rate
```

### Data transfer

```text
transfer_cost = outbound_transfer_gb × outbound_rate
             + intra_region_transfer_gb × intra_region_rate
```

### Total S3 cost

```text
total_s3_cost = storage_cost + request_cost + transfer_cost
```

## Lambda

### Request cost

```text
free_requests = 1_000_000 if include_free_tier else 0
billable_requests = max(0, total_requests - free_requests)
request_cost = billable_requests × request_rate_per_request
```

### Compute cost

```text
duration_seconds = duration_ms / 1000
memory_gb = memory_mb / 1024
total_gb_seconds = total_requests × duration_seconds × memory_gb

free_gb_seconds = 400_000 if include_free_tier else 0
billable_gb_seconds = max(0, total_gb_seconds - free_gb_seconds)

compute_cost = billable_gb_seconds × duration_rate_per_gb_second
```

### Ephemeral storage

```text
free_mb = 512
additional_mb = max(0, storage_mb - free_mb)
additional_gb = additional_mb / 1024

storage_gb_seconds = total_requests × duration_seconds × additional_gb
storage_cost = storage_gb_seconds × storage_rate_per_gb_second
```

### Provisioned concurrency

```text
if provisioned_concurrency > 0:
    provisioned_gb_seconds = provisioned_concurrency × memory_gb × 2_592_000
    provisioned_cost = provisioned_gb_seconds × provisioned_rate_per_gb_second
else:
    provisioned_cost = 0
```

### Total Lambda cost

```text
total_lambda_cost = request_cost + compute_cost + storage_cost + provisioned_cost
```

## DynamoDB

### Storage

```text
storage_cost = tiered_pricing(storage_gb, storage_tiers)
```

### On-demand reads and writes

```text
read_units_per_request = ceil(avg_item_size_kb / 4)
total_read_units = on_demand_reads_per_month × read_units_per_request
read_cost = tiered_pricing(total_read_units, read_tiers)

write_units_per_request = ceil(avg_item_size_kb / 1)
total_write_units = on_demand_writes_per_month × write_units_per_request
write_cost = tiered_pricing(total_write_units, write_tiers)
```

### Provisioned capacity

```text
rcu_hours = provisioned_read_capacity_units × 730
wcu_hours = provisioned_write_capacity_units × 730

provisioned_read_cost = tiered_pricing(rcu_hours, read_tiers)
provisioned_write_cost = tiered_pricing(wcu_hours, write_tiers)
```

### Backup and restore charges

```text
pitr_cost = tiered_pricing(storage_gb, pitr_tiers)
backup_storage_cost = tiered_pricing(backup_storage_gb, backup_tiers)
restore_cost = tiered_pricing(restore_data_size_gb, restore_tiers)
```

### Total DynamoDB cost

```text
total_dynamodb_cost = storage_cost
                   + read_cost
                   + write_cost
                   + provisioned_read_cost
                   + provisioned_write_cost
                   + pitr_cost
                   + backup_storage_cost
                   + restore_cost
```

## API Gateway

### HTTP API / REST API

```text
billable_requests = requests × request_multiplier
api_cost = tiered_pricing(billable_requests, pricing_tiers)
```

For HTTP API, the multiplier is derived from request and response payload size, typically using chunk-based billing.

### WebSocket messages

```text
message_chunks = ceil(message_kb / 32)
total_billable_messages = messages × message_chunks
message_cost = tiered_pricing(total_billable_messages, message_tiers)
```

### WebSocket connections

```text
connection_cost = tiered_pricing(connection_minutes, minute_tiers)
```

### Cache cost

```text
cache_cost = cache_size_gb × cache_rate_per_gb_hour × 730
```

## Elastic Load Balancer (ELB)

### ALB / NLB / GWLB shared pattern

```text
hourly_cost = monthly_hours × hourly_rate
lcu_hours = lcu_per_hour × monthly_hours
lcu_cost = lcu_hours × lcu_rate_per_hour
reserved_lcu_cost = reserved_lcu_per_hour × monthly_hours × reserved_rate_per_hour

total_cost = hourly_cost + lcu_cost + reserved_lcu_cost
```

### CLB

```text
clb_cost = monthly_hours × clb_hourly_rate
        + data_processed_gb × clb_data_rate_per_gb
```

## Elastic Beanstalk

```text
ec2_cost = instance_count × monthly_hours × instance_hourly_rate
alb_cost = monthly_hours × alb_hourly_rate + estimated_lcu × alb_lcu_rate × monthly_hours
storage_cost = max(0, storage_gb - free_storage_gb) × ebs_rate
monitoring_cost = enhanced_monitoring_enabled ? instance_count × monitoring_rate : 0
data_transfer_cost = max(0, data_transfer_gb - free_transfer_gb) × transfer_rate
auto_scaling_cost = auto_scaling_enabled ? policy_rate : 0

total_beanstalk_cost = ec2_cost + alb_cost + storage_cost + monitoring_cost + data_transfer_cost + auto_scaling_cost
```

## Cognito

### Monthly active users

```text
free_mau = 50_000
billable_mau = max(0, mau - free_mau)
mau_cost = billable_mau × mau_rate_per_user
```

### SMS MFA / advanced security / custom domain / email customization

```text
sms_mfa_cost = mfa_enabled and mfa_type == "sms" ? mfa_users × sms_rate : 0
advanced_security_cost = advanced_security_enabled ? max(0, risk_evaluated_logins - 50_000) × rate : 0
custom_domain_cost = custom_domain_enabled ? domain_rate : 0
email_customization_cost = email_customization_enabled ? monthly_emails × email_rate_per_1000 / 1000 : 0
```

### Total Cognito cost

```text
total_cognito_cost = mau_cost
                  + sms_mfa_cost
                  + advanced_security_cost
                  + custom_domain_cost
                  + email_customization_cost
```

## Additional service families

The same pattern is used across the rest of the calculator, including:

- CloudFront
- CloudWatch
- EC2
- RDS
- SQS
- ElastiCache

For those services, the calculator depends on their pricing tiers and usage quantities in the service configuration files.

## Key constants

| Name | Typical value | Purpose |
|------|---------------|---------|
| HOURS_PER_MONTH | 730 | Monthly conversion for hourly rates |
| SECONDS_PER_MONTH | 2,592,000 | Lambda / concurrency calculations |
| LAMBDA_FREE_REQUESTS | 1,000,000 | Free-tier request allowance |
| LAMBDA_FREE_GB_SECONDS | 400,000 | Free-tier compute allowance |
| COGNITO_FREE_MAU | 50,000 | Free-tier user allowance |

## Summary

At a high level, SystemArcht calculates cost using this formula:

```text
monthly_total = Σ(service_costs for all enabled AWS services)
```

The application is designed to make these calculations transparent, explainable, and easy to compare across different AWS architecture scenarios.
