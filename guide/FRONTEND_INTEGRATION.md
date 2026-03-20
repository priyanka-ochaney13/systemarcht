# Frontend Integration Quick Reference

## 🔗 Backend Endpoint

```
POST http://localhost:8000/api/api-gateway/calculate
```

---

## 📊 Region Mapping

```javascript
// Frontend → Backend mapping
const REGION_MAP = {
  "Asia Pacific (Mumbai)": "ap-south-1",
  "Asia Pacific (Singapore)": "ap-southeast-1",
  "Asia Pacific (Sydney)": "ap-southeast-2",
  "Asia Pacific (Tokyo)": "ap-northeast-1",
  "Asia Pacific (Seoul)": "ap-northeast-2",
  "Europe (Ireland)": "eu-west-1",
  "Europe (London)": "eu-west-2",
  "Europe (Frankfurt)": "eu-central-1",
  "Europe (Paris)": "eu-west-3",
  "Europe (Stockholm)": "eu-north-1",
  "US East (N. Virginia)": "us-east-1",
  "US East (Ohio)": "us-east-2",
  "US West (N. California)": "us-west-1",
  "US West (Oregon)": "us-west-2",
  "Canada (Central)": "ca-central-1",
  "South America (São Paulo)": "sa-east-1"
};
```

---

## 🔀 API Type Mapping

```javascript
const API_TYPE_MAP = {
  "HTTP API": "HTTP",
  "REST API": "REST",
  "WebSocket API": "WEBSOCKET"
};
```

---

## 📋 Conditional Fields Logic

```javascript
function getVisibleFields(apiType) {
  const fields = {
    showRequestSize: false,
    showResponseSize: false,
    showMessageSize: false,
    showConnectionMinutes: false,
    showCaching: false
  };

  switch(apiType) {
    case "HTTP API":
      fields.showRequestSize = true;
      fields.showResponseSize = true;
      break;
    
    case "REST API":
      fields.showCaching = true;
      break;
    
    case "WebSocket API":
      fields.showMessageSize = true;
      fields.showConnectionMinutes = true;
      break;
  }

  return fields;
}
```

---

## 📤 Request Builder

```javascript
function buildCalculateRequest(formData) {
  const apiType = API_TYPE_MAP[formData.apiType];
  
  const payload = {
    region: REGION_MAP[formData.region],
    api_type: apiType,
    requests_per_month: parseInt(formData.requestsPerMonth),
    enable_caching: false,
    cache_size_gb: null,
    request_size_kb: null,
    response_size_kb: null,
    message_size_kb: null,
    connection_minutes: null
  };

  // Add type-specific fields
  if (apiType === "HTTP") {
    payload.request_size_kb = parseFloat(formData.requestSizeKB);
    payload.response_size_kb = parseFloat(formData.responseSizeKB);
  }
  else if (apiType === "REST") {
    if (formData.enableCaching) {
      payload.enable_caching = true;
      payload.cache_size_gb = formData.cacheSizeGB;
    }
  }
  else if (apiType === "WEBSOCKET") {
    payload.message_size_kb = parseFloat(formData.messageSizeKB);
    payload.connection_minutes = parseInt(formData.connectionMinutes);
  }

  return payload;
}
```

---

## 📥 Response Parser

```javascript
function parseCalculateResponse(response) {
  const { breakdown, details } = response;
  
  return {
    totalCost: breakdown.total_cost,
    apiCost: breakdown.api_requests_cost,
    cacheCost: breakdown.cache_cost,
    connectionCost: breakdown.websocket_connection_cost,
    details: details
  };
}
```

---

## 🎨 Complete Example

```javascript
// 1. Form state
const [formData, setFormData] = useState({
  region: "Asia Pacific (Mumbai)",
  apiType: "REST API",
  requestsPerMonth: 1000000,
  requestSizeKB: 10,
  responseSizeKB: 5,
  messageSizeKB: 32,
  connectionMinutes: 100000,
  enableCaching: false,
  cacheSizeGB: "0.5"
});

// 2. Calculate cost
async function calculateCost() {
  const payload = buildCalculateRequest(formData);
  
  const response = await fetch('http://localhost:8000/api/api-gateway/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  
  const result = await response.json();
  const costs = parseCalculateResponse(result);
  
  console.log('Total Cost:', costs.totalCost);
  console.log('API Cost:', costs.apiCost);
  console.log('Cache Cost:', costs.cacheCost);
  console.log('Details:', costs.details);
  
  return costs;
}

// 3. Display cost breakdown
function CostDisplay({ costs }) {
  return (
    <div className="cost-breakdown">
      <h3>Estimated Monthly Cost</h3>
      
      {costs.apiCost > 0 && (
        <div>API Requests: ${costs.apiCost.toFixed(2)}</div>
      )}
      
      {costs.cacheCost > 0 && (
        <div>Cache: ${costs.cacheCost.toFixed(2)}</div>
      )}
      
      {costs.connectionCost > 0 && (
        <div>Connections: ${costs.connectionCost.toFixed(2)}</div>
      )}
      
      <div className="total">
        <strong>TOTAL: ${costs.totalCost.toFixed(2)}/month</strong>
      </div>
    </div>
  );
}
```

---

## ✅ Validation Rules

```javascript
function validateForm(formData) {
  const errors = [];
  const apiType = API_TYPE_MAP[formData.apiType];

  // Common validation
  if (!formData.region) {
    errors.push("Region is required");
  }
  if (formData.requestsPerMonth < 1) {
    errors.push("Requests must be greater than 0");
  }

  // HTTP API validation
  if (apiType === "HTTP") {
    if (!formData.requestSizeKB || formData.requestSizeKB <= 0) {
      errors.push("Request size must be greater than 0");
    }
    if (!formData.responseSizeKB || formData.responseSizeKB <= 0) {
      errors.push("Response size must be greater than 0");
    }
  }

  // WebSocket validation
  if (apiType === "WEBSOCKET") {
    if (!formData.messageSizeKB || formData.messageSizeKB <= 0) {
      errors.push("Message size must be greater than 0");
    }
    if (!formData.connectionMinutes || formData.connectionMinutes < 0) {
      errors.push("Connection minutes must be 0 or greater");
    }
  }

  // REST API caching validation
  if (apiType === "REST" && formData.enableCaching) {
    if (!formData.cacheSizeGB) {
      errors.push("Cache size is required when caching is enabled");
    }
  }

  return errors;
}
```

---

## 🚨 Error Handling

```javascript
async function calculateCostWithErrorHandling() {
  try {
    // Validate form
    const errors = validateForm(formData);
    if (errors.length > 0) {
      alert("Validation errors:\n" + errors.join("\n"));
      return;
    }

    // Call backend
    const costs = await calculateCost();
    
    // Update UI
    setCostBreakdown(costs);
    
  } catch (error) {
    console.error("Error calculating cost:", error);
    alert("Failed to calculate cost: " + error.message);
  }
}
```

---

## 📝 Sample Test Cases

### Test Case 1: HTTP API
```javascript
{
  region: "ap-south-1",
  api_type: "HTTP",
  requests_per_month: 1000000,
  request_size_kb: 34,
  response_size_kb: 10
}
// Expected: ~$2.00 (2M billable requests)
```

### Test Case 2: REST API with Cache
```javascript
{
  region: "ap-south-1",
  api_type: "REST",
  requests_per_month: 1000000,
  enable_caching: true,
  cache_size_gb: "0.5"
}
// Expected: ~$13.70 ($3.50 API + $10.20 cache)
```

### Test Case 3: WebSocket
```javascript
{
  region: "ap-south-1",
  api_type: "WEBSOCKET",
  requests_per_month: 1000000,
  message_size_kb: 32,
  connection_minutes: 100000
}
// Expected: ~$1.03 ($1.00 messages + $0.03 minutes)
```

---

## 🔍 Debugging Tips

1. **Check region code:** Use `ap-south-1`, not "Asia Pacific (Mumbai)"
2. **Check API type:** Use `HTTP`, not "HTTP API"
3. **Check request format:** All fields should be present (use `null` for unused)
4. **Check response:** Backend returns detailed breakdown in `details` field
5. **Use browser DevTools:** Inspect network requests/responses

---

## 📞 Get Available Regions

```javascript
async function fetchAvailableRegions() {
  const response = await fetch('http://localhost:8000/api/api-gateway/regions');
  const data = await response.json();
  
  console.log('Available regions:', data.regions);
  // Returns: ["ap-south-1", "us-east-1", ...]
  
  // Build reverse map for display
  const reverseMap = {};
  Object.entries(REGION_MAP).forEach(([display, code]) => {
    if (data.regions.includes(code)) {
      reverseMap[code] = display;
    }
  });
  
  return reverseMap;
}
```

---

## ✨ Features Removed

- ❌ VPC Link (not in backend)
- ❌ Data Transfer (separate service)

Don't include these in the UI!
