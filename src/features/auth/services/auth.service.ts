/**
 * @file auth.service.ts
 * @description Servicio de autenticación. Contiene las funciones `login` y
 * `logout` que se comunican con el backend y actualizan el `auth.store`.
 *
 * ## Modo mock
 * Mientras el backend esté en desarrollo, `USE_MOCK = true` devuelve
 * datos simulados sin hacer ninguna petición HTTP real.
 * Cuando el backend esté listo, cambia `USE_MOCK = false` — ningún
 * componente ni store necesita modificarse.
 *
 * ## Uso desde componentes o páginas
 * ```typescript
 * import { AuthService } from '@/features/auth/services/auth.service';
 *
 * // En el handler del formulario de login (login-page.tsx)
 * try {
 *   await AuthService.login({ email, password });
 *   navigate('/admin/joyas');
 * } catch (error) {
 *   // Mostrar mensaje de error al usuario
 * }
 *
 * // En el botón de cerrar sesión (navbar o sidebar)
 * AuthService.logout();
 * navigate('/login');
 * ```
 */

import { apiClient } from '@/api/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
    AuthResponse,
    LoginCredentials,
} from '@/features/auth/types/auth.types';

/**
 * Controla si el servicio usa datos simulados o llama al backend real.
 * - `true`  → Usa mocks locales (backend en desarrollo).
 * - `false` → Llama a los endpoints reales del backend.
 */
const USE_MOCK = true;

// ─── Datos mock ───────────────────────────────────────────────────────────────

/**
 * Respuesta simulada del backend para el usuario administrador.
 * Solo se usa cuando `USE_MOCK = true`.
 */
const MOCK_AUTH_RESPONSE: AuthResponse = {
    token: 'mock-jwt-token-admin-kob',
    user: {
        id: '1',
        name: 'Admin KOB',
        email: 'admin@kob.com',
        role: 'ADMIN',
    },
};

/**
 * Credenciales válidas en modo mock.
 * Solo se usan cuando `USE_MOCK = true`.
 */
const MOCK_CREDENTIALS = {
    email: 'admin@kob.com',
    password: 'admin123',
};

// ─── Servicio ─────────────────────────────────────────────────────────────────

/**
 * Servicio de autenticación de Joyería KOB.
 * Todas las operaciones relacionadas con sesión pasan por aquí.
 */
export const AuthService = {
    /**
     * Autentica al usuario con email y contraseña.
     *
     * En modo mock valida contra `MOCK_CREDENTIALS` y simula un delay
     * de red de 800ms para imitar el comportamiento real del backend.
     *
     * En modo real hace `POST /auth/login` y guarda la sesión en el store.
     *
     * @param credentials - Email y contraseña del usuario.
     * @throws {Error} Si las credenciales son incorrectas o el servidor falla.
     *
     * @example
     * ```typescript
     * try {
     *   await AuthService.login({ email, password });
     *   navigate('/admin/joyas');
     * } catch (error) {
     *   setErrorMessage('Credenciales incorrectas');
     * }
     * ```
     */
    login: async (credentials: LoginCredentials): Promise<void> => {
        if (USE_MOCK) {
            await simulateDelay(800);

            const isValid =
                credentials.email === MOCK_CREDENTIALS.email &&
                credentials.password === MOCK_CREDENTIALS.password;

            if (!isValid) {
                throw new Error('Credenciales incorrectas');
            }

            useAuthStore
                .getState()
                .setSession(MOCK_AUTH_RESPONSE.token, MOCK_AUTH_RESPONSE.user);

            return;
        }

        // ── Modo real ──────────────────────────────────────────────────────────
        const response = await apiClient.post<AuthResponse>(
            '/auth/login',
            credentials,
        );

        useAuthStore
            .getState()
            .setSession(response.data.token, response.data.user);
    },

    /**
     * Cierra la sesión del usuario actual.
     * Limpia el store y el `localStorage`. No hace petición al backend
     * porque los JWT son stateless — simplemente se descartan del cliente.
     *
     * Si en el futuro el backend implementa un endpoint de logout para
     * invalidar tokens en una blacklist, agregar la llamada aquí.
     *
     * @example
     * ```typescript
     * AuthService.logout();
     * navigate('/login');
     * ```
     */
    logout: (): void => {
        useAuthStore.getState().clearSession();
    },
};

// ─── Utilidades internas ──────────────────────────────────────────────────────

/**
 * Simula un retardo de red en modo mock.
 * No usar fuera de este archivo.
 *
 * @param ms - Milisegundos a esperar.
 */
const simulateDelay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));