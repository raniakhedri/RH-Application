import axios from 'axios';
import { clearAuthSnapshot } from '../utils/authStorage';

// Auto-detect API base:
//  1. Use VITE_API_URL env var if explicitly set
//  2. If running on localhost → assume backend is on :8080
//  3. Otherwise → use the deployed Render backend
const envUrl = (import.meta.env.VITE_API_URL as string)?.trim();
export const API_BASE = envUrl
  ? envUrl
  : window.location.hostname === 'localhost'
    ? `http://localhost:8080`
    : 'https://rh-antigone.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      // Add auth header if needed in future
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSnapshot();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
