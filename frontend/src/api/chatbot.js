import axios from 'axios';

// NEXT_PUBLIC_API_URL is the server root, e.g. http://localhost:8000
// The backend router is mounted at /api/architecture/calculate
const SERVER = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const analyzeArchitectureCost = async (payload) => {
  const url = `${SERVER}/api/architecture/calculate`;
  console.log('[ArchBot] POST', url);
  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};