/**
 * @file api-client.ts
 * @description Instancia base de Axios configurada para todas las peticiones
 * HTTP de la aplicación.
 *
 * Adjunta automáticamente el token JWT en cada request y maneja
 * sesiones expiradas o inválidas mediante interceptores globales.
 *
 * ## Responsabilidades
 * - Adjuntar JWT automáticamente
 * - Detectar respuestas 401
 * - Forzar logout automático
 * - Centralizar manejo de auth
 *
 * ## Importante
 * Nunca importes `axios` directamente en los servicios.
 * Usa siempre `apiClient`.
 */

import axios from 'axios';

import { useAuthStore } from '@/store/auth.store';
import { AuthService } from '@/features/auth/services/auth.service';

/**
 * Cliente HTTP principal de la aplicación.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ─────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR
// Adjunta automáticamente el JWT en cada request.
// ─────────────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  /**
   * Leer token directamente del store.
   * No usar hooks dentro de interceptors.
   */
  const token =
    useAuthStore.getState().token;

  // Adjuntar Authorization header
  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

// ─────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Maneja automáticamente:
// - token expirado
// - token inválido
// - sesión revocada
// ─────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const is401 =
      error.response?.status === 401;

    /**
     * Si el backend responde 401:
     * - limpiar sesión
     * - redirigir al login
     * - evitar sesiones zombie
     */
    if (is401) {
      AuthService.logout();
    }

    return Promise.reject(error);
  },
);