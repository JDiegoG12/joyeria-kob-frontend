/**
 * @file toast-container.tsx
 * @description Contenedor global para el sistema de notificaciones toast.
 * Debe montarse una sola vez en la raíz de la aplicación.
 * Posiciona la cola de mensajes en la esquina superior derecha y gestiona
 * las transiciones de layout con Framer Motion para evitar saltos bruscos
 * al entrar o salir notificaciones.
 *
 * Uso:
 * ```tsx
 * import { ToastContainer } from '@/components/ui/toast/toast-container';
 * <ToastContainer />
 * ```
 */

import { AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/toast.store';
import { ToastItem } from './toast-item';

/**
 * Componente contenedor de la cola de notificaciones.
 * Se renderiza fijo sobre el resto de la UI con un z-index superior a modales y drawers.
 * Usa `pointer-events-none` en el wrapper para permitir clics a través de los espacios vacíos,
 * y `pointer-events-auto` en cada ítem para mantener la interactividad.
 */
export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: '420px', width: 'calc(100% - 2rem)' }}
      aria-live="polite"
      aria-label="Notificaciones del sistema"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
