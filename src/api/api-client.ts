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
     * Endpoints de autenticación que devuelven 401 como parte de su flujo
     * NORMAL (p. ej. credenciales incorrectas en el login), NO por una sesión
     * expirada. Su 401 debe propagarse al componente (LoginPage /
     * AdminLoginPage) para mostrar el error inline.
     *
     * Antes, forzar `logout()` aquí disparaba un `window.location.replace('/')`
     * que redirigía a home y ocultaba el mensaje de error, haciendo que un
     * login fallido pareciera (erróneamente) un login exitoso.
     */
    const requestUrl = error.config?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    /**
     * Solo forzamos logout ante un 401 de una sesión YA iniciada (token
     * expirado o revocado en una petición protegida):
     * - limpiar sesión
     * - redirigir al login
     * - evitar sesiones zombie
     *
     * Los 401 de los endpoints de auth quedan excluidos.
     */
    if (is401 && !isAuthEndpoint) {
      AuthService.logout();
    }

    return Promise.reject(error);
  },
);