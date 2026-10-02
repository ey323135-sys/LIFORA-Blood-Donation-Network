import axios from 'axios';

// In production, if the API is served from the same origin (Express serves React),
// use relative '/api'. If deployed separately, use VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Attach JWT Token Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lifora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Error Interceptor — normalize error messages
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 401 means token expired or invalid — auto-logout
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('lifora_token');
        // Don't hard-redirect here; let AuthContext handle it via token state
      }
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject({ ...error, message });
  }
);

export default API;
