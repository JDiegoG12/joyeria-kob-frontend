import { apiClient } from '@/api/api-client';
import { useAuthStore } from '@/store/auth.store';

import type {
    AuthLoginData,
    LoginCredentials,
} from '@/features/auth/types/auth.types';

const USE_MOCK = false;

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

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

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        window.location.replace('/login');
    },

    // ─────────────────────────────
    // GET TOKEN
    // ─────────────────────────────
    getToken: (): string | null => {
        return localStorage.getItem(TOKEN_KEY);
    },

    // ─────────────────────────────
    // VALIDAR AUTENTICACIÓN
    // ─────────────────────────────
    isAuthenticated: (): boolean => {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
            return false;
        }

        try {
            const payload = JSON.parse(
                atob(token.split('.')[1]),
            );

            const isExpired =
                payload.exp * 1000 < Date.now();

            if (isExpired) {
                AuthService.logout();
                return false;
            }

            return true;
        } catch  {
            AuthService.logout();
            return false;
        }
    },
};

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

function persistSession(data: AuthLoginData) {
    useAuthStore
        .getState()
        .setSession(data.token, data.user);

    localStorage.setItem(TOKEN_KEY, data.token);

    localStorage.setItem(
        USER_KEY,
        JSON.stringify(data.user),
    );
}

const simulateDelay = (
    ms: number,
): Promise<void> =>
    new Promise((resolve) =>
        setTimeout(resolve, ms),
    );