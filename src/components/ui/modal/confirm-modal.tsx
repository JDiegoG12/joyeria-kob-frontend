/**
 * @file confirm-modal.tsx
 * @description Modal de confirmación reutilizable para el panel de administración
 * de Joyería KOB. Reemplaza por completo el uso de `window.confirm` y
 * `window.alert` en el módulo de gestión de joyas.
 *
 * ## Variantes
 * - `danger`  → Botón de acción en rojo. Úsalo para eliminar, descartar cambios
 *               o cualquier acción destructiva e irreversible.
 * - `warning` → Botón de acción en amarillo/ámbar. Úsalo para advertencias
 *               que requieren confirmación pero no son destructivas.
 * - `info`    → Botón de acción en el acento de marca. Úsalo para confirmar
 *               acciones neutras que solo necesitan validación del usuario.
 *
 * ## Uso básico
 * ```tsx
 * import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
 *
 * <ConfirmModal
 *   isOpen={isDiscardOpen}
 *   variant="danger"
 *   title="¿Descartar cambios?"
 *   message="Los datos ingresados se perderán. Esta acción no se puede deshacer."
 *   confirmLabel="Sí, descartar"
 *   cancelLabel="Cancelar"
 *   onConfirm={handleDiscard}
 *   onCancel={() => setIsDiscardOpen(false)}
 * />
 * ```
 *
 * ## Accesibilidad
 * - Foco atrapado dentro del modal mientras está abierto.
 * - `role="dialog"` y `aria-modal="true"` para lectores de pantalla.
 * - Cierre con la tecla Escape.
 * - El botón de cancelar recibe el foco inicial para que "Enter" no confirme
 *   accidentalmente una acción destructiva.
 */

import { useEffect, useRef } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Variante visual que determina el color del botón de acción principal. */
export type ConfirmModalVariant = 'danger' | 'warning' | 'info';

export interface ConfirmModalProps {
  /** Controla si el modal es visible. */
  isOpen: boolean;
  /** Variante visual del modal. Por defecto `'danger'`. */
  variant?: ConfirmModalVariant;
  /** Título principal del modal. Debe ser corto y directo. */
  title: string;
  /** Mensaje descriptivo de la acción a confirmar. */
  message: string;
  /** Texto del botón de confirmación. Por defecto `'Confirmar'`. */
  confirmLabel?: string;
  /** Texto del botón de cancelación. Por defecto `'Cancelar'`. */
  cancelLabel?: string;
  /** `true` mientras se está procesando la acción (deshabilita botones y muestra spinner). */
  isLoading?: boolean;
  /** Callback ejecutado al confirmar la acción. */
  onConfirm: () => void;
  /** Callback ejecutado al cancelar o cerrar el modal. */
  onCancel: () => void;
}

// ─── Helpers de estilo ────────────────────────────────────────────────────────

/** Mapa de clases CSS para el botón de acción según variante. */
const CONFIRM_BUTTON_CLASSES: Record<ConfirmModalVariant, string> = {
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 active:scale-95 cursor-pointer',
  warning:
    'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 active:scale-95 cursor-pointer',
  info: 'bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 active:opacity-80 active:scale-95 cursor-pointer',
};

/** Mapa de iconos SVG inline por variante. */
const VARIANT_ICON: Record<ConfirmModalVariant, React.ReactNode> = {
  danger: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  warning: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  info: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

/** Mapa de colores del contenedor del icono por variante. */
const ICON_CONTAINER_CLASSES: Record<ConfirmModalVariant, string> = {
  danger: 'bg-red-500/10 text-red-500',
  warning: 'bg-amber-500/10 text-amber-500',
  info: 'bg-[var(--accent)]/10 text-[var(--accent)]',
};

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Modal de confirmación accesible y reutilizable.
 * Gestiona el foco y el cierre con Escape automáticamente.
 */
export const ConfirmModal = ({
  isOpen,
  variant = 'danger',
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en el botón cancelar al abrir (previene confirmación accidental)
  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para que el DOM esté listo tras el render
      const timeout = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Cierre con Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      {/* Panel del modal */}
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono + título */}
        <div className="mb-4 flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ICON_CONTAINER_CLASSES[variant]}`}
          >
            {VARIANT_ICON[variant]}
          </div>

          <div>
            <h3
              id="confirm-modal-title"
              className="text-base font-semibold text-[var(--text-primary)]"
            >
              {title}
            </h3>
            <p
              id="confirm-modal-message"
              className="mt-1 text-sm text-[var(--text-secondary)]"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-[var(--border-color)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${CONFIRM_BUTTON_CLASSES[variant]}`}
          >
            {isLoading && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
