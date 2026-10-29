import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de Petición: Inyecta automáticamente el token JWT en cada request privada
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bicicleteria_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: Si el token expiró (401), limpia la sesión
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('bicicleteria_token');
      localStorage.removeItem('bicicleteria_usuario');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

