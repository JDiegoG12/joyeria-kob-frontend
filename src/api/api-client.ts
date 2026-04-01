import axios from 'axios';

/**
 * Instancia centralizada de Axios para el Frontend.
 * Usa import.meta.env porque estamos en un entorno de Vite.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para inyectar Token de Usuario
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  // Clonamos config para que Airbnb no se queje de la reasignación
  const newConfig = { ...config };

  if (token && newConfig.headers) {
    newConfig.headers.Authorization = `Bearer ${token}`;
  }

  return newConfig;
});
