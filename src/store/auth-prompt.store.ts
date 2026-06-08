/**
 * @file auth-prompt.store.ts
 * @description Store Zustand que controla el modal "necesitas iniciar sesión".
 *
 * Se dispara cuando un visitante sin sesión intenta una acción que requiere
 * cuenta (p. ej. agregar a favoritos). En lugar de redirigir directamente a
 * `/login`, abrimos un modal que explica la situación y deja al usuario elegir
 * entre ir a iniciar sesión o permanecer donde está.
 *
 * El modal se renderiza una sola vez en `MainLayout` (donde existe contexto de
 * router para `navigate`), y cualquier componente puede abrirlo con `open()`.
 *
 * Uso:
 * ```ts
 * import { useAuthPromptStore } from '@/store/auth-prompt.store';
 * const open = useAuthPromptStore((s) => s.open);
 * open();
 * ```
 */

import { create } from 'zustand';

/** Forma del estado del store del modal de autenticación requerida. */
interface AuthPromptState {
  /** Controla la visibilidad del modal. */
  isOpen: boolean;
  /** Abre el modal de "inicia sesión para continuar". */
  open: () => void;
  /** Cierra el modal sin tomar ninguna acción. */
  close: () => void;
}

/**
 * Store global del modal de autenticación requerida.
 * Mantiene un único estado de apertura compartido por toda la app.
 */
export const useAuthPromptStore = create<AuthPromptState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
