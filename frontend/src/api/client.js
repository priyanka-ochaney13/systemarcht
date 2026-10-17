import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Pricing Calculator APIs
export const calculateAPIGatewayCost = async (params) => {
  const response = await apiClient.post('/api-gateway/calculate', params);
  return response.data;
};

export const calculateLambdaCost = async (params) => {
  const response = await apiClient.post('/lambda/calculate', params);
  return response.data;
};

export const calculateS3Cost = async (params) => {
  const response = await apiClient.post('/s3/calculate', params);
  return response.data;
};

export const calculateCognitoCost = async (params) => {
  const response = await apiClient.post('/cognito/calculate', params);
  return response.data;
};

export const calculateDynamoDBCost = async (params) => {
  const response = await apiClient.post('/dynamodb/calculate', params);
  return response.data;
};

export const getDynamoDBRegions = async () => {
  const response = await apiClient.get('/dynamodb/regions');
  return response.data;
};

export const calculateELBCost = async (params) => {
  const response = await apiClient.post('/elb/calculate', params);
  return response.data;
};

export const getELBRegions = async () => {
  const response = await apiClient.get('/elb/regions');
  return response.data;
};

export const getELBTypes = async () => {
  const response = await apiClient.get('/elb/lb-types');
  return response.data;
};

export const calculateElasticBeanstalkCost = async (params) => {
  const response = await apiClient.post('/elastic-beanstalk/calculate', params);
  return response.data;
};

export const getInstanceTypes = async (region) => {
  const response = await apiClient.get(`/elastic-beanstalk/instance-types?region=${region}`);
  return response.data;
};

// Architecture APIs
export const saveArchitecture = async (architecture) => {
  try {
    const response = await apiClient.post('/architecture', architecture);
    return response.data;
  } catch (error) {
    console.error('Error saving architecture:', error);
    throw error;
  }
};

export const getArchitectures = async () => {
  try {
    const response = await apiClient.get('/architecture');
    return response.data;
  } catch (error) {
    console.error('Error fetching architectures:', error);
    return [];
  }
};

export const simulateArchitecture = async (architecture) => {
  try {
    const response = await apiClient.post('/architecture/calculate', architecture);
    return response.data;
  } catch (error) {
    console.error('Error simulating architecture:', error);
    throw error;
  }
};

// Module 1 AI assistant API (kept separate from the Playground chatbot).
export const chatWithArchitectureAssistant = async (message) => {
  const response = await apiClient.post('/ai/chat', { message });
  return response.data;
};

// Module 5 Mermaid diagram API. The backend validates the architecture first.
export const generateArchitectureDiagram = async (architecture) => {
  const response = await apiClient.post('/ai/architecture/diagram', { architecture });
  return response.data;
};

export const calculateCloudWatchCost = async (params) => {
  const response = await apiClient.post('/cloudwatch/calculate', params);
  return response.data;
};

export const getCloudWatchRegions = async () => {
  const response = await apiClient.get('/cloudwatch/regions');
  return response.data;
};

export const calculateCloudFrontCost = async (params) => {
  const response = await apiClient.post('/cloudfront/calculate', params);
  return response.data;
};

export const getCloudFrontRegions = async () => {
  const response = await apiClient.get('/cloudfront/regions');
  return response.data;
};

export const calculateElastiCacheCost = async (params) => {
  const response = await apiClient.post('/elasticache/calculate', params);
  return response.data;
};

export const getElastiCacheRegions = async () => {
  const response = await apiClient.get('/elasticache/regions');
  return response.data;
};

export const calculateSQSCost = async (params) => {
  const response = await apiClient.post('/sqs/calculate', params);
  return response.data;
};

export const getSQSRegions = async () => {
  const response = await apiClient.get('/sqs/regions');
  return response.data;
};

// ============================================================
// AI ARCHITECT ASSISTANT APIS (Conversations & Architecture Generation)
// ============================================================

export const getAIConversations = async () => {
  const response = await apiClient.get('/ai-architect/conversations');
  return response.data;
};

export const createAIConversation = async (title = 'New Architecture Chat') => {
  const response = await apiClient.post('/ai-architect/conversations', { title });
  return response.data;
};

export const getAIConversation = async (convId) => {
  const response = await apiClient.get(`/ai-architect/conversations/${convId}`);
  return response.data;
};

export const updateAIConversationTitle = async (convId, title) => {
  const response = await apiClient.patch(`/ai-architect/conversations/${convId}`, { title });
  return response.data;
};

export const deleteAIConversation = async (convId) => {
  const response = await apiClient.delete(`/ai-architect/conversations/${convId}`);
  return response.data;
};

export const sendAIMessage = async (convId, message) => {
  const response = await apiClient.post(`/ai-architect/conversations/${convId}/messages`, { message });
  return response.data;
};

export const editAIMessage = async (convId, messageId, message) => {
  const response = await apiClient.put(`/ai-architect/conversations/${convId}/messages/${messageId}`, { message });
  return response.data;
};
