/**
 * @file theme.store.ts
 * @description Store de Zustand para gestionar el tema visual de la aplicación
 * (claro u oscuro). Persiste la preferencia del usuario en `localStorage` bajo
 * la clave `"kob-theme"`.
 *
 * ## Uso en componentes
 * ```tsx
 * import { useThemeStore } from '@/store/theme.store';
 *
 * const MyComponent = () => {
 *   const { theme, toggleTheme } = useThemeStore();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Tema actual: {theme}
 *     </button>
 *   );
 * };
 * ```
 *
 * ## Relación con el DOM
 * Este store **solo maneja el estado**. La sincronización real con la clase
 * `dark` del elemento `<html>` la hace el hook `useTheme` (ver `use-theme.ts`).
 * Nunca manipules el DOM directamente desde aquí.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Valores posibles para el tema de la aplicación. */
export type Theme = 'light' | 'dark';

/** Forma del estado y las acciones del store de tema. */
interface ThemeState {
    /**
     * Tema actualmente activo.
     * - `'light'`: Modo claro (por defecto).
     * - `'dark'`: Modo oscuro — activa la clase `dark` en `<html>`.
     */
    theme: Theme;

    /**
     * Cambia el tema entre `'light'` y `'dark'`.
     *
     * @example
     * ```tsx
     * const { toggleTheme } = useThemeStore();
     * <button onClick={toggleTheme}>Cambiar tema</button>
     * ```
     */
    toggleTheme: () => void;

    /**
     * Establece un tema específico de forma directa.
     * Útil para inicializar el tema desde la preferencia del sistema operativo
     * o para un selector de tema con más de dos opciones en el futuro.
     *
     * @param theme - El tema a establecer: `'light'` o `'dark'`.
     *
     * @example
     * ```tsx
     * const { setTheme } = useThemeStore();
     *
     * // Detectar preferencia del sistema y aplicarla
     * const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
     * setTheme(prefersDark ? 'dark' : 'light');
     * ```
     */
    setTheme: (theme: Theme) => void;
}

/**
 * Store global de tema construido con Zustand + middleware `persist`.
 *
 * - Persiste automáticamente en `localStorage` con la clave `"kob-theme"`.
 * - Solo serializa la propiedad `theme`; las acciones no se persisten.
 *
 * @see {@link useTheme} para el hook que sincroniza este estado con el DOM.
 */
export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',

            toggleTheme: () => {
                const next: Theme = get().theme === 'light' ? 'dark' : 'light';
                set({ theme: next });
            },

            setTheme: (theme: Theme) => {
                set({ theme });
            },
        }),
        {
            name: 'kob-theme',
            // Solo persiste el valor del tema, no las funciones
            partialize: (state) => ({ theme: state.theme }),
        },
    ),
);