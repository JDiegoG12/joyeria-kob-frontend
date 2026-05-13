/**
 * @file auth.service.ts
 * @description Servicio central de autenticación. Gestiona login, registro,
 * logout y validación de sesión activa. Toda comunicación con el backend
 * pasa por `apiClient`; el interceptor 401 configurado en ese cliente es
 * la barrera de seguridad real contra tokens inválidos o expirados.
 *
 * ## Persistencia del token
 * El token JWT y los datos del usuario se persisten **exclusivamente** a través
 * del middleware `persist` de Zustand, que los escribe en `localStorage` bajo
 * la clave `"kob-auth"`. No se realizan escrituras manuales adicionales en
 * `localStorage`, eliminando la duplicación de estado en múltiples claves.
 */

import { apiClient } from '@/api/api-client';
import { useAuthStore } from '@/store/auth.store';

import type {
    AuthLoginData,
    LoginCredentials,
} from '@/features/auth/types/auth.types';

export const AuthService = {
    // ─────────────────────────────
    // LOGIN
    // ─────────────────────────────

    /**
     * Inicia sesión con las credenciales proporcionadas.
     * Envía las credenciales al backend y persiste la sesión si la respuesta es válida.
     *
     * @param credentials - Email y contraseña del usuario.
     * @throws {Error} Si las credenciales son incorrectas o el servidor falla.
     */
    login: async (credentials: LoginCredentials): Promise<void> => {
        try {
            const { data: envelope } = await apiClient.post<{
                success: boolean;
                data: AuthLoginData;
                message: string;
            }>('/auth/login', credentials);

            const authData = envelope?.data;

            if (!authData?.token || !authData?.user) {
                throw new Error('Respuesta inválida del servidor');
            }

            persistSession(authData);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error.message ||
                'Error al iniciar sesión';

            throw new Error(message);
        }
    },

    // ─────────────────────────────
    // REGISTER
    // ─────────────────────────────

    /**
     * Registra un nuevo usuario cliente en el sistema.
     *
     * @param data - Datos del nuevo usuario. `phone` es opcional.
     * @throws {Error} Si el email ya está en uso o el servidor falla.
     */
    register: async (data: {
        name: string;
        lastName: string;
        email: string;
        password: string;
        phone?: string;
    }): Promise<void> => {
        try {
            await apiClient.post('/auth/register', data);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error.message ||
                'Error al registrar usuario';

            throw new Error(message);
        }
    },

    // ─────────────────────────────
    // LOGOUT
    // ─────────────────────────────

    /**
     * Cierra la sesión activa: limpia el store y redirige al login
     * correspondiente según el rol del usuario.
     *
     * El middleware `persist` de Zustand se encarga automáticamente de
     * eliminar `"kob-auth"` de `localStorage` al llamar a `clearSession()`.
     * No se requieren llamadas manuales a `localStorage.removeItem`.
     *
     * El rol se lee antes de limpiar el store para poder usarlo en la redirección.
     */
    logout: (): void => {
        const role = useAuthStore.getState().user?.role;
        useAuthStore.getState().clearSession();
        if (role === 'ADMIN') {
            window.location.replace('/admin/login');
        } else {
            window.location.replace('/');
        }
    },

    // ─────────────────────────────
    // GET TOKEN
    // ─────────────────────────────

    /**
     * Devuelve el JWT activo desde el store de Zustand, o `null` si no existe.
     *
     * @returns El token JWT como string, o `null`.
     */
    getToken: (): string | null => {
        return useAuthStore.getState().token;
    },

    // ─────────────────────────────
    // VALIDAR AUTENTICACIÓN
    // ─────────────────────────────

    /**
     * Indica si el usuario tiene una sesión activa y no expirada.
     *
     * ## Alcance de esta validación
     * Esta función es una **optimización de UX**: evita peticiones innecesarias
     * al backend cuando el token ya expiró localmente. NO valida la firma
     * criptográfica del JWT, ya que eso requeriría exponer la clave secreta
     * del servidor en el cliente. La validación real de firma ocurre en el
     * backend en cada request protegido; el interceptor 401 de `apiClient`
     * llama a `logout()` automáticamente si el servidor rechaza el token.
     *
     * ## Qué sí verifica
     * - Que existe un token en el store de Zustand.
     * - Que el token tiene exactamente tres segmentos (formato JWT válido).
     * - Que el payload contiene un campo `exp` numérico.
     * - Que la fecha de expiración (`exp`) no ha pasado.
     *
     * @returns `true` si el token existe y no ha expirado; `false` en cualquier
     * otro caso. Ejecuta `logout()` como efecto secundario si detecta un token
     * malformado o expirado.
     */
    isAuthenticated: (): boolean => {
        const token = useAuthStore.getState().token;

        if (!token) {
            return false;
        }

        try {
            const parts = token.split('.');

            if (parts.length !== 3) {
                AuthService.logout();
                return false;
            }

            const payload = JSON.parse(atob(parts[1]));

            if (typeof payload.exp !== 'number') {
                AuthService.logout();
                return false;
            }

            if (payload.exp * 1000 < Date.now()) {
                AuthService.logout();
                return false;
            }

            return true;
        } catch {
            AuthService.logout();
            return false;
        }
    },
};

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

/**
 * Persiste la sesión del usuario en el store de Zustand.
 * El middleware `persist` se encarga de sincronizar el estado con
 * `localStorage["kob-auth"]` automáticamente — no se requiere ninguna
 * escritura manual adicional.
 *
 * @param data - Token JWT y datos del usuario devueltos por el backend.
 */
function persistSession(data: AuthLoginData) {
    useAuthStore
        .getState()
        .setSession(data.token, data.user);
}