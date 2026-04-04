/**
 * @file use-theme.ts
 * @description Hook personalizado que conecta el store de Zustand con el DOM.
 * Se encarga de agregar o quitar la clase `dark` en el elemento `<html>`
 * cada vez que el tema cambia, lo cual activa los estilos de Tailwind CSS
 * definidos con `@custom-variant dark` en `index.css`.
 *
 * ## ¿Por qué este hook existe?
 * El store (`theme.store.ts`) solo maneja el estado en memoria y en
 * `localStorage`. Por sí solo, no modifica el DOM. Este hook es el puente
 * que traduce ese estado en una acción visible en la página.
 *
 * ## Cómo usarlo
 * Llama a `useTheme()` **una sola vez** en el componente raíz (`App.tsx`).
 * No necesitas llamarlo en ningún otro componente.
 *
 * ```tsx
 * // App.tsx
 * import { useTheme } from '@/hooks/use-theme';
 *
 * export const App = () => {
 *   useTheme(); // ← Inicializa y sincroniza el tema con el DOM
 *
 *   return <RouterProvider router={router} />;
 * };
 * ```
 *
 * Para leer el tema o cambiarlo en cualquier otro componente,
 * usa el store directamente:
 *
 * ```tsx
 * // cualquier componente
 * import { useThemeStore } from '@/store/theme.store';
 *
 * const { theme, toggleTheme } = useThemeStore();
 * ```
 */

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme.store';

/**
 * Sincroniza el tema del store de Zustand con la clase `dark` del `<html>`.
 *
 * - Si el tema es `'dark'`, agrega la clase `dark` al elemento `<html>`.
 * - Si el tema es `'light'`, remueve la clase `dark` del elemento `<html>`.
 *
 * Debe llamarse **únicamente en `App.tsx`** para evitar efectos duplicados.
 *
 * @example
 * ```tsx
 * // App.tsx
 * export const App = () => {
 *   useTheme();
 *   return <main>...</main>;
 * };
 * ```
 */
export const useTheme = (): void => {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        const root = document.documentElement; // Elemento <html>

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]); // Se ejecuta cada vez que el tema cambia
};