#!/usr/bin/env python3
"""Debug script to check pricing data extraction"""
import json

# Load the JSON files
with open(r"c:\Users\91915\OneDrive\Desktop\Home\Degree\6th Sem\capstone\systemarcht\backend\pricing_data\elastic_beanstalk.json") as f:
    eb_data = json.load(f)

with open(r"c:\Users\91915\OneDrive\Desktop\Home\Degree\6th Sem\capstone\systemarcht\backend\pricing_data\cognito.json") as f:
    cognito_data = json.load(f)

print("=" * 60)
print("PRICING DATA STRUCTURE INSPECTION")
print("=" * 60)

# Check Elastic Beanstalk
print("\n1. Elastic Beanstalk JSON Structure")
print("-" * 60)
print(f"Total products: {len(eb_data['products'])}")
print(f"Total terms: {len(eb_data.get('terms', {}).get('OnDemand', {}))}")

# Sample a compute SKU
sample_sku = 'EBEC201000'
if sample_sku in eb_data['products']:
    print(f"\nSample Compute SKU ({sample_sku}):")
    print(f"  Product: {json.dumps(eb_data['products'][sample_sku], indent=2)[:200]}...")

# Sample term
if sample_sku in eb_data['terms']['OnDemand']:
    term = eb_data['terms']['OnDemand'][sample_sku]
    print(f"\nSample Term for {sample_sku}:")
    print(f"  {json.dumps(term, indent=2)[:300]}...")

# Sample ALB
sample_alb = 'EBALB01264'
if sample_alb in eb_data['products']:
    print(f"\nSample ALB SKU ({sample_alb}):")
    print(f"  {json.dumps(eb_data['products'][sample_alb], indent=2)[:200]}...")

if sample_alb in eb_data['terms']['OnDemand']:
    term = eb_data['terms']['OnDemand'][sample_alb]
    print(f"\nSample ALB Term:")
    print(f"  {json.dumps(term, indent=2)[:300]}...")

# Check Cognito
print("\n\n2. Cognito JSON Structure")
print("-" * 60)
print(f"Total products: {len(cognito_data['products'])}")
print(f"Total terms: {len(cognito_data.get('terms', {}).get('OnDemand', {}))}")

# Sample MAU SKU
sample_cogn = 'COG02000'
if sample_cogn in cognito_data['products']:
    print(f"\nSample MAU SKU ({sample_cogn}):")
    print(f"  {json.dumps(cognito_data['products'][sample_cogn], indent=2)[:200]}...")

if sample_cogn in cognito_data['terms']['OnDemand']:
    term = cognito_data['terms']['OnDemand'][sample_cogn]
    print(f"\nSample MAU Term:")
    print(f"  {json.dumps(term, indent=2)}")
