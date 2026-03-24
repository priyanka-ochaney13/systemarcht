import { create } from 'zustand';

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
    outbound_transfer_gb: 50,
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
    risk_evaluated_logins: 100000,
    custom_domain_enabled: false,
    email_customization_enabled: false,
    monthly_emails: 50000,
  },
  
  updateAPIGatewayConfig: (config) => set({ apiGatewayConfig: config }),
  updateLambdaConfig: (config) => set({ lambdaConfig: config }),
  updateS3Config: (config) => set({ s3Config: config }),
  updateCognitoConfig: (config) => set({ cognitoConfig: config }),
}));

export const usePricingStore = create((set) => ({
  apiGatewayCost: null,
  lambdaCost: null,
  s3Cost: null,
  cognitoCost: null,
  totalCost: 0,
  
  setAPIGatewayCost: (cost) => set((state) => ({
    apiGatewayCost: cost,
    totalCost: (cost?.breakdown?.total_cost || 0) + 
               (state.lambdaCost?.breakdown?.total_cost || 0) + 
               (state.s3Cost?.breakdown?.total_cost || 0) +
               (state.cognitoCost?.breakdown?.total_cost || 0),
  })),
  
  setLambdaCost: (cost) => set((state) => ({
    lambdaCost: cost,
    totalCost: (state.apiGatewayCost?.breakdown?.total_cost || 0) + 
               (cost?.breakdown?.total_cost || 0) + 
               (state.s3Cost?.breakdown?.total_cost || 0) +
               (state.cognitoCost?.breakdown?.total_cost || 0),
  })),
  
  setS3Cost: (cost) => set((state) => ({
    s3Cost: cost,
    totalCost: (state.apiGatewayCost?.breakdown?.total_cost || 0) + 
               (state.lambdaCost?.breakdown?.total_cost || 0) + 
               (cost?.breakdown?.total_cost || 0) +
               (state.cognitoCost?.breakdown?.total_cost || 0),
  })),

  setCognitoCost: (cost) => set((state) => ({
    cognitoCost: cost,
    totalCost: (state.apiGatewayCost?.breakdown?.total_cost || 0) + 
               (state.lambdaCost?.breakdown?.total_cost || 0) + 
               (state.s3Cost?.breakdown?.total_cost || 0) +
               (cost?.breakdown?.total_cost || 0),
  })),
  
  reset: () => set({
    apiGatewayCost: null,
    lambdaCost: null,
    s3Cost: null,
    cognitoCost: null,
    totalCost: 0,
  }),
}));
