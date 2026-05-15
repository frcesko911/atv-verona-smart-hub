import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://10.30.1.4:3001',
});

// Restore token from localStorage on initial load
const savedToken = localStorage.getItem('atv_token');
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

// Interceptor ensures every request picks up the latest token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('atv_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});