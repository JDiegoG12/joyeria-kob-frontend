/**
 * @file delete-confirm-modal.tsx
 * @description Modal de confirmación antes de eliminar una categoría.
 *
 * Muestra el nombre de la categoría a eliminar y explica las condiciones
 * de error posibles (hijos, productos). Tiene dos botones: cancelar y confirmar.
 *
 * ## Uso
 * ```tsx
 * <DeleteConfirmModal
 *   categoryName="Anillos"
 *   isDeleting={isDeleting}
 *   error={mutationError}
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowModal(false)}
 * />
 * ```
 */

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  /** Nombre de la categoría que se va a eliminar. */
  categoryName: string;
  /** `true` mientras se ejecuta la petición de eliminación. */
  isDeleting: boolean;
  /** Mensaje de error del backend, si la eliminación falló. */
  error: string | null;
  /** Se dispara cuando el usuario confirma la eliminación. */
  onConfirm: () => void;
  /** Se dispara cuando el usuario cancela o cierra el modal. */
  onCancel: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Modal de confirmación para eliminar una categoría.
 * Gestiona su propia animación de entrada/salida con Framer Motion.
 */
export const DeleteConfirmModal = ({
  categoryName,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="delete-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-70 flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--bg-overlay)' }}
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel del modal */}
      <motion.div
        key="delete-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-71 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Ícono de advertencia */}
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}
              >
                <AlertTriangle
                  size={20}
                  style={{ color: 'var(--color-error)' }}
                />
              </div>
              <h2
                id="delete-modal-title"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                }}
              >
                Eliminar categoría
              </h2>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="rounded-md p-1.5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cuerpo */}
          <div className="mt-4">
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              ¿Estás seguro de que deseas eliminar{' '}
              <span
                style={{
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                }}
              >
                "{categoryName}"
              </span>
              ? Esta acción es permanente y no se puede deshacer.
            </p>

            <p
              className="mt-2"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              No podrás eliminar esta categoría si tiene subcategorías o
              productos asociados.
            </p>
          </div>

          {/* Error del backend */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg px-4 py-3"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-error)',
                }}
              >
                {error}
              </p>
            </motion.div>
          )}

          {/* Acciones */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="rounded-xl px-5 py-2.5 transition-colors"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'transparent';
              }}
            >
              Cancelar
            </button>

            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 transition-opacity"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
                backgroundColor: 'var(--color-error)',
                color: 'var(--color-white)',
                opacity: isDeleting ? 'var(--opacity-disabled)' : '1',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 size={15} />
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
