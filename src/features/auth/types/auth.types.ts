/**
 * @file auth.types.ts
 * @description Tipos e interfaces del dominio de autenticación.
 * Alineados con las respuestas reales del backend (wrapper { success, data, message }).
 */

/** Roles disponibles en el sistema. */
export type UserRole = 'ADMIN' | 'CLIENT';

/**
 * Datos del usuario autenticado tal como los devuelve el backend.
 */
export interface AuthUser {
  id: string;
  name: string;
  lastName: string;
  phone: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
}

/**
 * Credenciales para el endpoint POST /api/auth/login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Datos para el endpoint POST /api/auth/register
 */
export interface RegisterData {
  name: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

/**
 * Forma del objeto `data` dentro de la respuesta de login:
 * { success: true, data: AuthLoginData, message: string }
 */
export interface AuthLoginData {
  token: string;
  user: AuthUser;
}

/**
 * Wrapper genérico de respuesta del backend.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}