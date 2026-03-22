// Mock pricing calculator responses
export const mockAPIGatewayCalculate = (params) => {
  const { api_type, requests_per_month, enable_caching, cache_size_gb } = params;
  
  if (api_type === 'HTTP') {
    const requestCost = (requests_per_month / 1_000_000) * 1.0;
    return {
      service: 'api_gateway',
      breakdown: {
        total_cost: requestCost,
        api_requests_cost: requestCost,
        cache_cost: 0,
        websocket_connection_cost: 0,
      },
      details: {
        http_api: {
          actual_requests: requests_per_month,
          billable_requests: requests_per_month,
          cost_usd: requestCost,
        },
      },
    };
  } else if (api_type === 'REST') {
    const requestCost = (requests_per_month / 1_000_000) * 3.5;
    const cacheCost = enable_caching 
      ? (parseFloat(cache_size_gb) / 0.5) * 0.02 * 730 // simplified
      : 0;
    return {
      service: 'api_gateway',
      breakdown: {
        total_cost: requestCost + cacheCost,
        api_requests_cost: requestCost,
        cache_cost: cacheCost,
        websocket_connection_cost: 0,
      },
      details: {
        rest_api: {
          actual_requests: requests_per_month,
          billable_requests: requests_per_month,
          cost_usd: requestCost,
        },
        cache: {
          enabled: enable_caching,
          size_gb: cache_size_gb,
          cost_usd: cacheCost,
        },
      },
    };
  }
};

export const mockLambdaCalculate = (params) => {
  const {
    requests_per_month,
    average_duration_ms,
    allocated_memory_mb,
    architecture,
    include_free_tier,
    provisioned_concurrency,
  } = params;

  // Free tier: 1M requests, 400K GB-seconds
  const freeRequests = include_free_tier ? 1_000_000 : 0;
  const billableRequests = Math.max(0, requests_per_month - freeRequests);
  const requestCost = (billableRequests / 1_000_000) * 0.2;

  // Compute GB-seconds
  const gbSeconds = (requests_per_month * average_duration_ms * allocated_memory_mb) / (1000 * 1024);
  const freeGbSeconds = include_free_tier ? 400_000 : 0;
  const billableGbSeconds = Math.max(0, gbSeconds - freeGbSeconds);
  
  const durationRate = architecture === 'arm64' ? 0.0000133334 : 0.0000166667;
  const durationCost = billableGbSeconds * durationRate;

  const provisionedCost = provisioned_concurrency.count > 0 
    ? provisioned_concurrency.count * allocated_memory_mb * 0.015 * 730 / 1024
    : 0;

  const totalCost = requestCost + durationCost + provisionedCost;

  return {
    service: 'lambda',
    breakdown: {
      total_cost: totalCost,
      requests_cost: requestCost,
      duration_cost: durationCost,
      provisioned_cost: provisionedCost,
    },
    details: {
      requests: {
        total: requests_per_month,
        free_tier: freeRequests,
        billable: billableRequests,
        rate: '$0.20 per 1M',
        cost_usd: requestCost,
      },
      duration: {
        gb_seconds: gbSeconds,
        free_tier: freeGbSeconds,
        billable: billableGbSeconds,
        rate: `$${durationRate} per GB-second`,
        cost_usd: durationCost,
      },
      provisioned: {
        enabled: provisioned_concurrency.count > 0,
        instances: provisioned_concurrency.count,
        cost_usd: provisionedCost,
      },
    },
  };
};

export const mockS3Calculate = (params) => {
  const {
    storage_class,
    storage_gb,
    put_requests,
    get_requests,
    delete_requests,
    outbound_transfer_gb,
  } = params;

  const storageRates = {
    'S3 Standard': 0.023,
    'S3 Intelligent-Tiering': 0.0125, // avg
    'S3 Standard-IA': 0.0125,
    'S3 One Zone-IA': 0.01,
    'S3 Glacier Instant': 0.004,
  };

  const rate = storageRates[storage_class] || 0.023;
  const storageCost = storage_gb * rate;

  // Request costs per 1,000 requests
  const putCost = (put_requests / 1000) * 0.005;
  const getCost = (get_requests / 1000) * 0.0004;
  const deleteCost = (delete_requests / 1000) * 0.0004;
  const requestCost = putCost + getCost + deleteCost;

  // Data transfer: first 1GB free, then $0.09/GB
  const billableTransfer = Math.max(0, outbound_transfer_gb - 1);
  const transferCost = billableTransfer * 0.09;

  const totalCost = storageCost + requestCost + transferCost;

  return {
    service: 's3',
    breakdown: {
      total_cost: totalCost,
      storage_cost: storageCost,
      request_cost: requestCost,
      transfer_cost: transferCost,
    },
    details: {
      storage: {
        size_gb: storage_gb,
        rate_per_gb: rate,
        cost_usd: storageCost,
      },
      requests: {
        put: put_requests,
        get: get_requests,
        delete: delete_requests,
        cost_usd: requestCost,
      },
      transfer: {
        outbound_gb: outbound_transfer_gb,
        free_gb: 1,
        billable_gb: billableTransfer,
        cost_usd: transferCost,
      },
    },
  };
};
