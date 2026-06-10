/**
 * @file auth.store.ts
 * @description Store de Zustand para gestionar el estado de autenticación.
 * Persiste el token JWT y los datos del usuario en `localStorage` bajo la
 * clave `"kob-auth"` mediante el middleware `persist`. Es la **única fuente
 * de verdad** para la sesión activa — no existe ninguna escritura manual
 * paralela en `localStorage`.
 *
 * ## Uso básico en componentes
 * ```tsx
 * import { useAuthStore } from '@/store/auth.store';
 *
 * const MyComponent = () => {
 *   const { user, isAuthenticated, logout } = useAuthStore();
 *
 *   if (!isAuthenticated) return <p>No has iniciado sesión</p>;
 *
 *   return (
 *     <div>
 *       <p>Bienvenido, {user?.name}</p>
 *       <button onClick={logout}>Cerrar sesión</button>
 *     </div>
 *   );
 * };
 * ```
 *
 * ## Uso para verificar rol en guards
 * ```typescript
 * import { useAuthStore } from '@/store/auth.store';
 *
 * const { hasRole } = useAuthStore();
 *
 * if (!hasRole('ADMIN')) {
 *   // redirigir
 * }
 * ```
 *
 * ## Relación con otros módulos
 * - `ProtectedRoute`  consume `isAuthenticated` y `hasRole`.
 * - `auth.service.ts`  llama a `setSession` y `clearSession`.
 * - `api-client.ts` leerá `token` para adjuntarlo al header `Authorization`.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  AuthUser,
  UserRole,
} from '@/features/auth/types/auth.types';

import { useFavoriteStore } from '@/features/favorites';

/** Forma del estado y las acciones del store de autenticación. */
interface AuthState {
  /**
   * Token JWT activo. `null` si no hay sesión.
   * Se adjunta como `Authorization: Bearer <token>` en cada petición HTTP.
   */
  token: string | null;

  /**
   * Datos del usuario autenticado. `null` si no hay sesión.
   */
  user: AuthUser | null;

  /**
   * Indica si hay una sesión activa válida.
   * Es `true` cuando existe un token y datos de usuario en el store.
   */
  isAuthenticated: boolean;

  /**
   * Guarda el token y los datos del usuario al iniciar sesión correctamente.
   * Debe llamarse desde `auth.service.ts` tras recibir la respuesta del backend.
   *
   * @param token - JWT recibido del backend.
   * @param user - Datos del usuario autenticado.
   *
   * @example
   * ```typescript
   * // Dentro de auth.service.ts
   * const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
   * useAuthStore.getState().setSession(response.data.token, response.data.user);
   * ```
   */
  setSession: (token: string, user: AuthUser) => void;

  /**
   * Elimina el token y los datos del usuario al cerrar sesión.
   * Limpia también `localStorage` gracias al middleware `persist`.
   *
   * @example
   * ```typescript
   * const { logout } = useAuthStore();
   * <button onClick={logout}>Cerrar sesión</button>
   * ```
   */
  clearSession: () => void;

  /**
   * Verifica si el usuario autenticado tiene el rol requerido.
   * Usado principalmente por `ProtectedRoute` para controlar acceso.
   *
   * @param role - Rol a verificar contra el usuario actual.
   * @returns `true` si el usuario existe y su rol coincide.
   *
   * @example
   * ```typescript
   * const { hasRole } = useAuthStore();
   * const puedeAdministrar = hasRole('ADMIN');
   * ```
   */
  hasRole: (role: UserRole) => boolean;
}

/**
 * Store global de autenticación construido con Zustand + middleware `persist`.
 *
 * - Persiste `token`, `user` e `isAuthenticated` en `localStorage["kob-auth"]`.
 * - Es la única fuente de verdad para la sesión: `AuthService` no escribe en
 *   `localStorage` directamente; delega toda la persistencia a este store.
 * - Las funciones (`setSession`, `clearSession`, `hasRole`) quedan excluidas
 *   de la serialización mediante `partialize`.
 *
 * @see {@link ProtectedRoute} para el uso en guards de rutas.
 * @see {@link AuthService} para el servicio que llama a `setSession`.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setSession: (token: string, user: AuthUser) => {
        set({ token, user, isAuthenticated: true });
      },

      clearSession: () => {
        /**
         * Limpia también los favoritos al cerrar sesión.
         */
        useFavoriteStore.getState().clearFavorites();

        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      hasRole: (role: UserRole): boolean => {
        return get().user?.role === role;
      },
    }),
    {
      name: 'kob-auth',

      // Solo persiste los datos de sesión, no las funciones
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);