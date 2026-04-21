import { apiClient } from '@/api/api-client';
import { useAuthStore } from '@/store/auth.store';
import type {
    AuthLoginData,
    LoginCredentials,
} from '@/features/auth/types/auth.types';

const USE_MOCK = false;

const MOCK_AUTH_RESPONSE: AuthLoginData = {
    token: 'mock-jwt-token-admin-kob',
    user: {
        id: '1',
        name: 'Admin KOB',
        lastName: 'KOB',
        phone: null,
        email: 'admin@kob.com',
        role: 'ADMIN',
        createdAt: '2023-01-01T00:00:00.000Z',
    },
};

const MOCK_CREDENTIALS = {
    email: 'admin@kob.com',
    password: 'admin123',
};

export const AuthService = {
    // ─────────────────────────────
    // LOGIN
    // ─────────────────────────────
    login: async (credentials: LoginCredentials): Promise<void> => {
        if (USE_MOCK) {
            await simulateDelay(800);

            const isValid =
                credentials.email === MOCK_CREDENTIALS.email &&
                credentials.password === MOCK_CREDENTIALS.password;

            if (!isValid) {
                throw new Error('Credenciales incorrectas');
            }

            persistSession(MOCK_AUTH_RESPONSE);
            return;
        }

        try {
            // ✅ El backend responde con { success, data: { token, user }, message }
            // Por eso tipamos el envelope completo y extraemos `.data`
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

    // ✅ Ahora incluye lastName, requerido por el backend (campo NOT NULL en DB)
    register: async (data: {
        name: string;
        lastName: string;
        email: string;
        password: string;
        phone?: string;
    }): Promise<void> => {
        if (USE_MOCK) {
            await simulateDelay(800);
            return;
        }

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
    logout: (): void => {
        useAuthStore.getState().clearSession();

        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
    },
};

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

function persistSession(data: AuthLoginData) {
    useAuthStore.getState().setSession(data.token, data.user);

    localStorage.setItem('auth-token', data.token);
    localStorage.setItem('auth-user', JSON.stringify(data.user));
}

const simulateDelay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));