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
