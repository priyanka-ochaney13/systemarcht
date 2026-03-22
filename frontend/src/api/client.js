import axios from 'axios';
import {
  mockAPIGatewayCalculate,
  mockLambdaCalculate,
  mockS3Calculate,
} from '../lib/mocks';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Pricing Calculator APIs
export const calculateAPIGatewayCost = async (params) => {
  try {
    // For now, use mock in development
    if (process.env.NODE_ENV === 'development') {
      return mockAPIGatewayCalculate(params);
    }
    const response = await apiClient.post('/api-gateway/calculate', params);
    return response.data;
  } catch (error) {
    console.error('Error calculating API Gateway cost:', error);
    return mockAPIGatewayCalculate(params);
  }
};

export const calculateLambdaCost = async (params) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return mockLambdaCalculate(params);
    }
    const response = await apiClient.post('/lambda/calculate', params);
    return response.data;
  } catch (error) {
    console.error('Error calculating Lambda cost:', error);
    return mockLambdaCalculate(params);
  }
};

export const calculateS3Cost = async (params) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return mockS3Calculate(params);
    }
    const response = await apiClient.post('/s3/calculate', params);
    return response.data;
  } catch (error) {
    console.error('Error calculating S3 cost:', error);
    return mockS3Calculate(params);
  }
};

// Architecture APIs
export const saveArchitecture = async (architecture) => {
  try {
    const response = await apiClient.post('/architectures', architecture);
    return response.data;
  } catch (error) {
    console.error('Error saving architecture:', error);
    throw error;
  }
};

export const getArchitectures = async () => {
  try {
    const response = await apiClient.get('/architectures');
    return response.data;
  } catch (error) {
    console.error('Error fetching architectures:', error);
    return [];
  }
};

export const simulateArchitecture = async (architecture, workload) => {
  try {
    const response = await apiClient.post('/simulations', {
      architecture,
      workload,
    });
    return response.data;
  } catch (error) {
    console.error('Error simulating architecture:', error);
    throw error;
  }
};
