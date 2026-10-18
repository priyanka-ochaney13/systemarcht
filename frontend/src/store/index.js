import { create } from 'zustand';
export { useLearningStore } from './learningStore';

export const useArchitectureStore = create((set) => ({
  nodes: [],
  connections: [],
  selectedNodeId: null,
  selectedServiceType: null,

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),

  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
  })),

  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id),
    connections: state.connections.filter(c => c.source !== id && c.target !== id),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
  })),

  addConnection: (connection) => set((state) => ({
    connections: [...state.connections, connection],
  })),

  removeConnection: (id) => set((state) => ({
    connections: state.connections.filter(c => c.id !== id),
  })),

  selectNode: (id) => set({
    selectedNodeId: id,
  }),

  selectServiceType: (type) => set({
    selectedServiceType: type,
  }),

  clearSelection: () => set({
    selectedNodeId: null,
    selectedServiceType: null,
  }),

  loadArchitecture: (architecture) => set({
    nodes: (architecture.nodes || []).map(node => ({
      ...node,
      // Normalize: if node has 'type', use it as 'serviceType'
      serviceType: node.serviceType || node.type,
    })),
    connections: architecture.connections || [],
  }),

  clearArchitecture: () => set({
    nodes: [],
    connections: [],
    selectedNodeId: null,
    selectedServiceType: null,
  }),

  getArchitectureData: (state) => ({
    nodes: state.nodes,
    connections: state.connections,
  }),
}));

let initialServiceConfigs = {};

export const useServiceConfigStore = create((set) => ({
  apiGatewayConfig: {
    region: 'ap-south-1',
    api_type: 'REST',
    requests_per_month: 1000000,
  },

  lambdaConfig: {
    region: 'ap-south-1',
    architecture: 'x86_64',
    requests_per_month: 1000000,
    average_duration_ms: 200,
    allocated_memory_mb: 512,
    include_free_tier: true,
    provisioned_concurrency: { enabled: false, count: 0 },
  },

  s3Config: {
    region: 'ap-south-1',
    storage_class: 'S3 Standard',
    storage_gb: 100,
    put_requests: 10000,
    get_requests: 100000,
    delete_requests: 1000,
    outbound_transfer_gb: 0,
  },

  ec2Config: {
    region: 'us-east-1',
    instance_type: 't3.medium',
    instance_count: 1,
    hours_per_month: 730,
  },

  rdsConfig: {
    region: 'us-east-1',
    db_engine: 'MySQL',
    deployment: 'Single-AZ',
    instance_type: 'db.t3.medium',
    instance_count: 1,
    hours_per_month: 730,
    storage_gb: 20,
  },

  dynamoDBConfig: {
    region: 'us-east-1',
    storage_gb: 100,
    avg_item_size_kb: 4.0,
    on_demand_enabled: false,
    on_demand_reads_per_month: 0,
    on_demand_writes_per_month: 0,
    provisioned_enabled: false,
    provisioned_read_capacity_units: 0,
    provisioned_write_capacity_units: 0,
    backup_enabled: false,
    pitr_enabled: false,
    backup_storage_gb: 0,
    restore_data_size_gb: 0,
  },

  elbConfig: {
    region: 'us-east-1',
    lb_type: 'application',
    hours_per_month: 730,
    lcu_count: 0,
    reserved_lcu_count: 0,
    trust_store_hours: 0,
    data_processed_gb: 0,
  },

  cognitoConfig: {
    region: 'ap-south-1',
    mau: 1000000,
    signups_per_month: 10000,
    signins_per_month: 100000,
    token_refreshes_per_month: 50000,
    mfa_enabled: false,
    mfa_type: 'sms',
    mfa_percentage: 30,
    advanced_security_enabled: false,
    advanced_security_mau: 100000,
    custom_domain_enabled: false,
    email_customization_enabled: false,
    monthly_emails: 50000,
  },

  elasticBeanstalkConfig: {
    region: 'ap-south-1',
    environment_type: 'single',
    instance_type: 't3.small',
    instance_count: 1,
    enable_load_balancer: false,
    cross_zone_enabled: false,
    enable_auto_scaling: false,
    min_instances: 1,
    max_instances: 10,
    target_cpu_utilization: 70,
    storage_gb: 30,
    volume_type: 'gp3',
    enable_enhanced_monitoring: false,
    data_transfer_gb: 10,
    include_free_tier: false,
  },

  cloudWatchConfig: {
    region: 'ap-south-1',
    custom_metrics: 50,
    standard_alarms: 10,
    high_res_alarms: 0,
    logs_ingested_gb: 10,
    logs_storage_gb: 50,
    dashboards: 2,
    api_requests_per_month: 1000000,
    include_free_tier: true,
  },

  cloudFrontConfig: {
    region: 'IN', // CloudFront price group, not AWS region
    data_transfer_out_gb: 1000,
    https_requests: 5000000,
    http_requests: 100000,
    invalidation_paths: 100,
    include_free_tier: true,
  },

  elastiCacheConfig: {
    region: 'ap-south-1',
    engine: 'redis',
    node_type: 'cache.t3.micro',
    number_of_nodes: 1,
    hours_per_month: 730,
    backup_storage_gb: 0,
    include_free_tier: true,
  },

  sqsConfig: {
    region: 'ap-south-1',
    queue_type: 'standard',
    requests_per_month: 1000000,
    avg_payload_size_kb: 1,
    data_transfer_out_gb: 0,
    include_free_tier: true,
  },

  updateAPIGatewayConfig: (config) => set({ apiGatewayConfig: config }),
  updateLambdaConfig: (config) => set({ lambdaConfig: config }),
  updateS3Config: (config) => set({ s3Config: config }),
  updateEC2Config: (config) => set({ ec2Config: config }),
  updateRDSConfig: (config) => set({ rdsConfig: config }),
  updateCognitoConfig: (config) => set({ cognitoConfig: config }),
  updateDynamoDBConfig: (config) => set({ dynamoDBConfig: config }),
  updateELBConfig: (config) => set({ elbConfig: config }),
  updateElasticBeanstalkConfig: (config) => set({ elasticBeanstalkConfig: config }),
  updateCloudWatchConfig: (config) => set({ cloudWatchConfig: config }),
  updateCloudFrontConfig: (config) => set({ cloudFrontConfig: config }),
  updateElastiCacheConfig: (config) => set({ elastiCacheConfig: config }),
  updateSQSConfig: (config) => set({ sqsConfig: config }),
  loadServiceConfigs: (configs) =>
    set((state) =>
      Object.fromEntries(
        Object.entries(configs || {}).filter(
          ([key, value]) =>
            key.endsWith('Config') &&
            Object.prototype.hasOwnProperty.call(state, key) &&
            value &&
            typeof value === 'object' &&
            !Array.isArray(value)
        )
      )
    ),
  resetServiceConfigs: () => set(initialServiceConfigs),
}));

initialServiceConfigs = Object.fromEntries(
  Object.entries(useServiceConfigStore.getState()).filter(
    ([key, value]) => key.endsWith('Config') && value && typeof value === 'object'
  )
);

export const getServiceConfigs = () =>
  Object.fromEntries(
    Object.entries(useServiceConfigStore.getState()).filter(
      ([key, value]) => key.endsWith('Config') && value && typeof value === 'object'
    )
  );

// ------------------------------------------------------------------
// Pricing store
// Every service cost key is listed once here. totalCost is always
// recomputed from this list, so adding a new service only needs a
// new key + setter (no more editing every other setter's sum).
// ------------------------------------------------------------------

const COST_KEYS = [
  'apiGatewayCost',
  'lambdaCost',
  's3Cost',
  'ec2Cost',
  'rdsCost',
  'cognitoCost',
  'dynamoDBCost',
  'elbCost',
  'elasticBeanstalkCost',
  'cloudWatchCost',
  'cloudFrontCost',
  'elastiCacheCost',
  'sqsCost',
];

const computeTotal = (state, key, cost) =>
  COST_KEYS.reduce((sum, k) => {
    const value = k === key ? cost : state[k];
    return sum + (value?.breakdown?.total_cost || 0);
  }, 0);

const makeCostSetter = (set, key) => (cost) =>
  set((state) => ({
    [key]: cost,
    totalCost: computeTotal(state, key, cost),
  }));

const emptyCosts = () =>
  COST_KEYS.reduce((acc, k) => ({ ...acc, [k]: null }), {});

export const usePricingStore = create((set) => ({
  ...emptyCosts(),
  totalCost: 0,

  setAPIGatewayCost: makeCostSetter(set, 'apiGatewayCost'),
  setLambdaCost: makeCostSetter(set, 'lambdaCost'),
  setS3Cost: makeCostSetter(set, 's3Cost'),
  setEC2Cost: makeCostSetter(set, 'ec2Cost'),
  setRDSCost: makeCostSetter(set, 'rdsCost'),
  setCognitoCost: makeCostSetter(set, 'cognitoCost'),
  setDynamoDBCost: makeCostSetter(set, 'dynamoDBCost'),
  setELBCost: makeCostSetter(set, 'elbCost'),
  setElasticBeanstalkCost: makeCostSetter(set, 'elasticBeanstalkCost'),
  setCloudWatchCost: makeCostSetter(set, 'cloudWatchCost'),
  setCloudFrontCost: makeCostSetter(set, 'cloudFrontCost'),
  setElastiCacheCost: makeCostSetter(set, 'elastiCacheCost'),
  setSQSCost: makeCostSetter(set, 'sqsCost'),

  reset: () => set({
    ...emptyCosts(),
    totalCost: 0,
  }),
}));