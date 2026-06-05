/**
 * @file api-client.ts
 * @description Instancia base de Axios configurada para todas las peticiones
 * HTTP de la aplicación. Adjunta automáticamente el token JWT del store
 * de autenticación en cada petición saliente.
 *
 * ## Uso en servicios
 * Importa siempre `apiClient` en lugar de `axios` directamente:
 *
 * ```typescript
 * import { apiClient } from '@/api/api-client';
 *
 * const response = await apiClient.get<IJewelryProduct[]>('/joyas');
 * ```
 *
 * ## Interceptor de request
 * Antes de cada petición, lee el token del `auth.store` y lo adjunta
 * como header `Authorization: Bearer <token>`. Si no hay token, la
 * petición sale sin ese header (para rutas públicas como `/auth/login`).
 *
 * ## Interceptor de response
 * Si el backend responde con `401 Unauthorized`, limpia la sesión del
 * store automáticamente y redirige al usuario a `/login`.
 */

import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

/**
 * Cliente HTTP base de la aplicación.
 * Usa la variable de entorno `VITE_API_URL` como `baseURL`.
 * Asegúrate de tenerla definida en tu archivo `.env`.
 *
 * @example `.env`
 * ```
 * VITE_API_URL=http://localhost:4000/api
 * ```
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptor de request: adjunta el JWT en cada petición ─────────────────
apiClient.interceptors.request.use((config) => {
  // Leer el token directamente del store sin usar hooks
  // (los interceptores viven fuera del árbol de React)
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Interceptor de response: maneja token expirado o inválido ───────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.response?.status === 401;

    if (is401) {
      // Limpiar sesión del store
      useAuthStore.getState().clearSession();
      // Redirigir al login fuera del árbol de React
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);