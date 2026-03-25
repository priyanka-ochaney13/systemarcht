/**
 * Converts store state (nodes + configs) into a valid ArchitectureRequest
 * that the FastAPI backend accepts at POST /api/architecture/calculate
 */

/**
 * Builds a ServiceNode config object based on the service type and
 * the shared config from useServiceConfigStore.
 */
const buildNodeConfig = (serviceType, serviceConfigs) => {
  switch (serviceType) {
    case 'lambda': {
      const c = serviceConfigs.lambdaConfig;
      return {
        region: c.region || 'ap-south-1',
        architecture: c.architecture || 'x86_64',
        requests_per_month: c.requests_per_month || 1_000_000,
        duration_ms: c.average_duration_ms || 200,
        memory_mb: c.allocated_memory_mb || 512,
        provisioned_concurrency: c.provisioned_concurrency?.enabled
          ? (c.provisioned_concurrency.count || 1)
          : 0,
      };
    }
    case 'api_gateway': {
      const c = serviceConfigs.apiGatewayConfig;
      return {
        region: c.region || 'ap-south-1',
        api_type: c.api_type || 'REST',
        requests_per_month: c.requests_per_month || 1_000_000,
      };
    }
    case 's3': {
      const c = serviceConfigs.s3Config;
      return {
        region: c.region || 'ap-south-1',
        storage_class: c.storage_class || 'S3 Standard',
        storage_gb: c.storage_gb || 100,
        put_requests: c.put_requests || 10_000,
        get_requests: c.get_requests || 100_000,
        delete_requests: c.delete_requests || 1_000,
        outbound_transfer_gb: c.outbound_transfer_gb || 50,
      };
    }
    default:
      return {};
  }
};

/**
 * Main builder: converts Zustand store state → ArchitectureRequest payload
 */
export const buildArchitecturePayload = (architectureStore, serviceConfigs) => {
  const { nodes, connections } = architectureStore;

  // Filter to only supported backend service types
  const supportedTypes = new Set(['lambda', 'api_gateway']);
  const validNodes = nodes.filter((n) => supportedTypes.has(n.serviceType));

  const apiNodes = validNodes.map((node) => ({
    id: node.id,
    service_type: node.serviceType,
    name: node.label || node.serviceType,
    config: buildNodeConfig(node.serviceType, serviceConfigs),
  }));

  const nodeIds = new Set(validNodes.map((n) => n.id));
  const apiConnections = connections
    .filter((c) => nodeIds.has(c.source) && nodeIds.has(c.target))
    .map((c) => ({
      id: c.id || `${c.source}-${c.target}`,
      source_id: c.source,
      target_id: c.target,
      avg_request_size_kb: 1.0,
      avg_response_size_kb: 1.0,
    }));

  return {
    name: 'My Architecture',
    nodes: apiNodes,
    connections: apiConnections,
    include_free_tier: true,
  };
};

/**
 * Checks if the current architecture has enough to calculate
 */
export const isArchitectureAnalyzable = (nodes) => {
  const supported = ['lambda', 'api_gateway'];
  return nodes.some((n) => supported.includes(n.serviceType));
};

/**
 * Formats a number as USD
 */
export const formatUSD = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val ?? 0);

/**
 * Converts a ArchitectureCostResponse into a structured chatbot message payload
 */
export const parseAnalysisResponse = (data) => {
  const { architecture_name, total_cost, breakdown, service_details, connection_details, warnings } = data;

  return {
    type: 'analysis',
    architectureName: architecture_name,
    totalCost: total_cost,
    servicesCost: breakdown?.services_cost ?? 0,
    transferCost: breakdown?.data_transfer_cost ?? 0,
    services: service_details ?? [],
    connections: connection_details ?? [],
    warnings: warnings ?? [],
  };
};