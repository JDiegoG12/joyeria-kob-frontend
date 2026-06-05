/**
 * @file toast.store.ts
 * @description Store Zustand para gestionar la cola de notificaciones toast.
 * Permite encolar mensajes de éxito, error, información o advertencia.
 * Se usa en todo el panel administrativo para dar feedback visual de acciones CRUD.
 *
 * Uso:
 * ```ts
 * import { useToastStore } from '@/store/toast.store';
 * const { showToast } = useToastStore();
 * showToast('success', 'Categoría creada correctamente');
 * ```
 */

import { create } from 'zustand';

/** Tipos de notificación soportados por el sistema. */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/** Estructura de un mensaje toast en la cola de renderizado. */
export interface Toast {
    /** Identificador único generado automáticamente para cada instancia. */
    id: string;
    /** Categoría visual y semántica del mensaje. */
    type: ToastType;
    /** Texto principal que se mostrará al usuario. */
    message: string;
    /** Tiempo de permanencia en pantalla en milisegundos. `0` lo hace persistente. */
    duration: number;
}

/** Forma del estado del store de notificaciones. */
interface ToastState {
    /** Lista ordenada de toasts activos en el viewport. */
    toasts: Toast[];
    /**
     * Encola un nuevo mensaje de notificación.
     * Limita la cola a 3 toasts simultáneos para evitar saturación visual.
     *
     * @param type - Clasificación semántica del mensaje.
     * @param message - Contenido legible por el usuario.
     * @param duration - Duración en ms (default: 3500).
     */
    showToast: (type: ToastType, message: string, duration?: number) => void;
    /**
     * Retira un toast específico de la cola por su identificador.
     *
     * @param id - `id` del toast a eliminar.
     */
    removeToast: (id: string) => void;
}

/**
 * Hook personalizado y store Zustand para el sistema de notificaciones.
 * Gestiona la cola de mensajes, evita saturación de la UI y expone
 * métodos seguros para disparar toasts desde cualquier componente.
 */
export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    showToast: (type, message, duration = 3500) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
            // Mantiene máximo 3 toasts visibles simultáneamente (FIFO)
            toasts: [...state.toasts.slice(-2), { id, type, message, duration }],
        }));
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
    },
}));