# API Gateway - Frontend UI Specification

## Overview
This document defines the exact UI behavior and backend integration for the API Gateway calculator.

---

## UI Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🌐 API Gateway Configuration                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📍 Region
   [Asia Pacific (Mumbai) ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️ API TYPE (Choose one)

   ( ) HTTP API          $1.00/million requests
       💡 Recommended - 71% cheaper than REST
   
   (•) REST API          $3.50/million requests  
       💡 Full features, higher cost
   
   ( ) WebSocket API     $1.00/million messages
       💡 For real-time communication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TRAFFIC & USAGE

   [Dynamic fields based on API type - see below]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ OPTIONAL FEATURES

   [Dynamic fields based on API type - see below]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ESTIMATED MONTHLY COST

   ┌─────────────────────────────────┐
   │  API Requests:      $X.XX       │
   │  Cache:             $X.XX       │  (REST only)
   │  Connections:       $X.XX       │  (WebSocket only)
   │  ───────────────────────────    │
   │  TOTAL:            $X.XX/month  │
   └─────────────────────────────────┘

   [Calculate]  [Reset]
```

---

## Field Visibility Rules

### When **HTTP API** is selected:
**Show:**
- Number of Requests/Month
- Average Request Size (KB)
- Average Response Size (KB)

**Hide:**
- Cache options
- Message size
- Connection minutes

**Cost Breakdown:**
- API Requests: $X.XX
- **TOTAL: $X.XX**

---

### When **REST API** is selected:
**Show:**
- Number of Requests/Month
- Enable Caching checkbox
- Cache Size dropdown (if caching enabled)

**Hide:**
- Request/Response sizes
- Message size
- Connection minutes

**Cost Breakdown:**
- API Requests: $X.XX
- Cache: $X.XX (if enabled)
- **TOTAL: $X.XX**

---

### When **WebSocket API** is selected:
**Show:**
- Number of Messages/Month
- Average Message Size (KB)
- Connection Minutes/Month

**Hide:**
- Request/Response sizes
- Cache options

**Cost Breakdown:**
- Messages: $X.XX
- Connections: $X.XX
- **TOTAL: $X.XX**

---

## Field Specifications

### Region Dropdown
- **Label:** "📍 Region"
- **Type:** Dropdown
- **Default:** Asia Pacific (Mumbai)
- **Options:** All AWS regions where API Gateway is available
- **Backend Mapping:** 
  ```javascript
  const REGION_MAP = {
    "Asia Pacific (Mumbai)": "ap-south-1",
    "US East (N. Virginia)": "us-east-1",
    "US East (Ohio)": "us-east-2",
    "US West (N. California)": "us-west-1",
    "US West (Oregon)": "us-west-2",
    "EU (Ireland)": "eu-west-1",
    "EU (London)": "eu-west-2",
    "EU (Frankfurt)": "eu-central-1",
    "Asia Pacific (Singapore)": "ap-southeast-1",
    "Asia Pacific (Sydney)": "ap-southeast-2",
    "Asia Pacific (Tokyo)": "ap-northeast-1",
    // Add more as needed
  };
  ```

### API Type Radio Buttons
- **Label:** "⚙️ API TYPE"
- **Type:** Radio (3 options)
- **Default:** REST API
- **Options:**
  - HTTP API - "$1.00/million" + "Recommended" badge
  - REST API - "$3.50/million"
  - WebSocket API - "$1.00/million messages"
- **Backend Mapping:**
  ```javascript
  const API_TYPE_MAP = {
    "HTTP API": "HTTP",
    "REST API": "REST",
    "WebSocket API": "WEBSOCKET"
  };
  ```

### Number of Requests/Month (HTTP & REST)
- **Label:** "Number of Requests/Month"
- **Type:** Number input
- **Default:** 1000000
- **Min:** 1
- **Unit Display:** "requests"
- **Note:** User enters actual count (not in millions)

### Number of Messages/Month (WebSocket)
- **Label:** "Number of Messages/Month"
- **Type:** Number input
- **Default:** 1000000
- **Min:** 1
- **Unit Display:** "messages"

### Average Request Size (HTTP only)
- **Label:** "Average Request Size"
- **Type:** Number input
- **Default:** 10
- **Min:** 0.01
- **Unit:** KB
- **Tooltip:** "Billed in 512 KB chunks for HTTP APIs"

### Average Response Size (HTTP only)
- **Label:** "Average Response Size"
- **Type:** Number input
- **Default:** 5
- **Min:** 0.01
- **Unit:** KB
- **Tooltip:** "Billed in 512 KB chunks for HTTP APIs"

### Average Message Size (WebSocket only)
- **Label:** "Average Message Size"
- **Type:** Number input
- **Default:** 32
- **Min:** 0.01
- **Unit:** KB
- **Tooltip:** "Billed in 32 KB chunks for WebSocket"

### Connection Minutes/Month (WebSocket only)
- **Label:** "Connection Minutes/Month"
- **Type:** Number input
- **Default:** 100000
- **Min:** 0
- **Unit:** minutes

### Enable Caching (REST only)
- **Label:** "Enable Caching"
- **Type:** Checkbox
- **Default:** Unchecked
- **Warning:** "⚠️ Costs $14-$5,472/month 24/7"

### Cache Size (REST only, when caching enabled)
- **Label:** "Cache Size"
- **Type:** Dropdown
- **Default:** 0.5 GB
- **Options:** 0.5 GB, 1.6 GB, 6.1 GB, 13.5 GB, 28.4 GB, 58.2 GB, 118 GB, 237 GB
- **Backend Value:** String ("0.5", "1.6", etc.)

---

## Backend API Integration

### Endpoint
```
POST /api/api-gateway/calculate
```

### Request Payloads

**HTTP API:**
```json
{
  "region": "ap-south-1",
  "api_type": "HTTP",
  "requests_per_month": 1000000,
  "request_size_kb": 10,
  "response_size_kb": 5,
  "enable_caching": false,
  "cache_size_gb": null
}
```

**REST API (no cache):**
```json
{
  "region": "ap-south-1",
  "api_type": "REST",
  "requests_per_month": 1000000,
  "request_size_kb": null,
  "response_size_kb": null,
  "enable_caching": false,
  "cache_size_gb": null
}
```

**REST API (with cache):**
```json
{
  "region": "ap-south-1",
  "api_type": "REST",
  "requests_per_month": 1000000,
  "request_size_kb": null,
  "response_size_kb": null,
  "enable_caching": true,
  "cache_size_gb": "0.5"
}
```

**WebSocket API:**
```json
{
  "region": "ap-south-1",
  "api_type": "WEBSOCKET",
  "requests_per_month": 1000000,
  "message_size_kb": 32,
  "connection_minutes": 100000,
  "request_size_kb": null,
  "response_size_kb": null,
  "enable_caching": false,
  "cache_size_gb": null
}
```

### Response Format

**HTTP API Response:**
```json
{
  "service": "api_gateway",
  "breakdown": {
    "total_cost": 2.0,
    "api_requests_cost": 2.0,
    "cache_cost": 0.0,
    "websocket_connection_cost": 0.0
  },
  "details": {
    "http_api": {
      "actual_requests": 1000000,
      "request_chunks": 1,
      "response_chunks": 1,
      "billable_requests": 2000000,
      "cost_usd": 2.0
    }
  }
}
```

**REST API Response (with cache):**
```json
{
  "service": "api_gateway",
  "breakdown": {
    "total_cost": 13.65,
    "api_requests_cost": 3.50,
    "cache_cost": 10.15,
    "websocket_connection_cost": 0.0
  },
  "details": {
    "rest_api": {
      "total_requests": 1000000,
      "cost_usd": 3.5
    },
    "cache": {
      "cache_size_gb": "0.5",
      "hourly_rate": 0.014,
      "monthly_cost": 10.22
    }
  }
}
```

**WebSocket API Response:**
```json
{
  "service": "api_gateway",
  "breakdown": {
    "total_cost": 1.025,
    "api_requests_cost": 1.0,
    "cache_cost": 0.0,
    "websocket_connection_cost": 0.025
  },
  "details": {
    "websocket": {
      "actual_messages": 1000000,
      "chunks_per_message": 1,
      "billable_messages": 1000000,
      "message_cost_usd": 1.0,
      "connection_minutes": 100000,
      "connection_cost_usd": 0.025
    }
  }
}
```

---

## Frontend Implementation Checklist

- [ ] Create region dropdown with display names
- [ ] Add region name to code mapping
- [ ] Create API type radio buttons
- [ ] Add API type display to code mapping
- [ ] Implement conditional field visibility logic
- [ ] Show/hide fields based on API type selection
- [ ] Add request/response size inputs (HTTP only)
- [ ] Add message size + connection minutes (WebSocket only)
- [ ] Add caching checkbox + dropdown (REST only)
- [ ] Implement form validation
- [ ] Build request payload with proper mapping
- [ ] Call backend API endpoint
- [ ] Parse response and display cost breakdown
- [ ] Handle error responses
- [ ] Add loading state during calculation
- [ ] Format currency display ($X.XX)

---

## Removed Features

The following features are **NOT** implemented:

❌ **VPC Link** - Not in pricing data, removed from UI  
❌ **Data Transfer** - Separate pricing, not part of API Gateway calculation  

---

## Notes

1. **Request Count Format:** Users enter actual numbers (1000000), not in millions (1)
2. **Cache Pricing:** Hourly rate × 730 hours/month
3. **HTTP API Chunking:** Both request and response count toward billable requests
4. **WebSocket:** Has two separate charges (messages + connection minutes)
5. **Validation:** Frontend should validate required fields before sending
