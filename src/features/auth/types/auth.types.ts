/**
 * @file auth.types.ts
 * @description Tipos e interfaces del dominio de autenticación.
 * Se usan en el store, el servicio y los componentes de auth.
 *
 * ## Relación con el backend
 * Estos tipos reflejan la forma esperada de los datos del backend.
 * Cuando los endpoints estén listos, verificar que coincidan con:
 * - `POST /api/auth/login` → responde con `AuthResponse`
 * - El payload del JWT decodificado → forma de `AuthUser`
 */

/** Roles disponibles en el sistema. */
export type UserRole = 'ADMIN' | 'CLIENT';

/**
 * Datos del usuario autenticado que se guardan en el store.
 * Son los campos mínimos necesarios para manejar sesión y permisos.
 */
export interface AuthUser {
    /** Identificador único del usuario en la base de datos. */
    id: string;
    /** Nombre para mostrar en la UI (navbar, sidebar). */
    name: string;
    /** Correo electrónico del usuario. */
    email: string;
    /** Rol que determina los permisos de acceso a rutas protegidas. */
    role: UserRole;
}

/**
 * Forma del cuerpo enviado al endpoint de login.
 *
 * @example
 * ```typescript
 * const credentials: LoginCredentials = {
 *   email: 'admin@kob.com',
 *   password: 'secreto123',
 * };
 * ```
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Forma de la respuesta del backend al autenticarse correctamente.
 * El token JWT se guarda en el store y se adjunta a cada petición HTTP.
 */
export interface AuthResponse {
    /** Token JWT firmado por el backend. */
    token: string;
    /** Datos básicos del usuario autenticado. */
    user: AuthUser;
}