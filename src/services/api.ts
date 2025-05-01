import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://web:8000/api/', // ✅ barra final obrigatória
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false,
});

export const checkBackendConnectivity = async () => {
  try {
    const response = await api.get('health/'); // ✅ com barra
    console.log('✅ Backend is reachable:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend connectivity issue:', error);
    return false;
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token && !config.url?.includes('auth/register/') && !config.url?.includes('auth/login/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('🧪 Interceptor:', {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    withToken: !!token,
  });

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('❌ Network error:', error);
      toast.error('Erro de conexão.');
    } else {
      console.error(`❌ Error response from ${error.config.url}:`, error.response);
      toast.error(error.response.data.message || 'Erro no servidor.');
    }
    return Promise.reject(error);
  }
);

export default api;
