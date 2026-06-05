/**
 * @file toast-item.tsx
 * @description Componente visual individual para una notificación toast.
 * Renderiza un mensaje con ícono semántico, animación de entrada/salida con
 * Framer Motion y botón de cierre. Se auto-elimina tras la duración configurada.
 *
 * Uso:
 * ```tsx
 * <ToastItem toast={toastData} onRemove={handleRemove} />
 * ```
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Toast, ToastType } from '@/store/toast.store';

// ─── Props ──────────────────────────────────────────────────────────────────
interface ToastItemProps {
  /** Datos completos del toast a renderizar. */
  toast: Toast;
  /** Callback para eliminar el toast de la cola del store. */
  onRemove: (id: string) => void;
}

// ─── Configuración semántica por tipo ───────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { icon: LucideIcon; color: string }> = {
  success: { icon: CheckCircle2, color: 'var(--color-success)' },
  error: { icon: AlertCircle, color: 'var(--color-error)' },
  warning: { icon: AlertTriangle, color: 'var(--color-warning)' },
  info: { icon: Info, color: 'var(--color-info)' },
};

// ─── Componente ─────────────────────────────────────────────────────────────
/**
 * Renderiza una única notificación toast con animación suave.
 * Gestiona su propio temporizador de auto-descarte y expone
 * el cierre manual mediante el botón `X`.
 */
export const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  // Auto-dismiss basado en la duración definida en el store
  useEffect(() => {
    if (toast.duration === 0) return;
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      role="alert"
      aria-live="assertive"
      className="flex w-full max-w-sm items-start gap-3 rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Ícono semántico */}
      <div className="mt-0.5 flex-shrink-0">
        <Icon size={18} style={{ color: config.color }} />
      </div>

      {/* Mensaje */}
      <div className="min-w-0 flex-1">
        <p
          className="break-words"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          {toast.message}
        </p>
      </div>

      {/* Botón de cierre */}
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-2 flex-shrink-0 rounded-lg p-1.5 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Cerrar notificación"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'var(--bg-hover)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'transparent';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};
