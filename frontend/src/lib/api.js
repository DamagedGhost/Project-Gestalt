import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

// Interceptor para inyectar Bearer token si existe en localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gestalt_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para limpiar token si la sesión expira
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('gestalt_token');
    }
    return Promise.reject(error);
  }
);

export default api;
