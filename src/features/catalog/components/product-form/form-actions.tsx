/**
 * @file form-actions.tsx
 * @description Barra de acciones FIJA (sticky) al pie de los formularios de
 * joyas, con resumen de errores. Compartida por crear y editar.
 *
 * ## Por qué sticky con resumen
 * El formulario es largo. Antes, al enviar con errores en los primeros campos,
 * estando abajo no había forma de enterarse sin subir a buscarlos. Esta barra:
 * - Mantiene «Cancelar» y el botón de envío SIEMPRE visibles (clave en móvil).
 * - Muestra un resumen ("Hay N campos por completar") con `role="alert"` para
 *   que el usuario sepa, desde el pie, que falta algo.
 *
 * El scroll/foco automático al primer campo con error lo aporta
 * `useScrollToFirstError`; esta barra es el complemento siempre-visible.
 *
 * ## Implementación
 * `position: sticky; bottom: 0` dentro del scroll del modal. Los márgenes
 * negativos (`-mx-6 -mb-6`) la extienden hasta los bordes del panel (que tiene
 * `p-6`) y `rounded-b-3xl` conserva las esquinas redondeadas del modal.
 */

import { AlertCircle } from 'lucide-react';
import { BTN_PRIMARY, BTN_SECONDARY } from './constants';

interface ProductFormActionsProps {
  /** Hay una operación de guardado en curso. */
  saving: boolean;
  /** Texto del botón primario en reposo (ej: "Crear joya"). */
  submitLabel: string;
  /** Texto del botón primario mientras guarda (ej: "Creando joya..."). */
  savingLabel: string;
  /** Texto del botón secundario. */
  cancelLabel?: string;
  /** Número de campos con error (para el resumen). */
  errorCount: number;
  /** Cierre/cancelación del formulario. */
  onCancel: () => void;
  /** Deshabilita el envío por una razón adicional (ej: edit sin cambios). */
  submitDisabled?: boolean;
}

/**
 * Pie de formulario sticky con resumen de errores y botones de acción.
 */
export const ProductFormActions = ({
  saving,
  submitLabel,
  savingLabel,
  cancelLabel = 'Cancelar',
  errorCount,
  onCancel,
  submitDisabled = false,
}: ProductFormActionsProps) => (
  <div
    className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-2 rounded-b-3xl border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-4"
    style={{ boxShadow: '0 -6px 16px -8px rgba(0, 0, 0, 0.18)' }}
  >
    {errorCount > 0 && (
      <div
        role="alert"
        className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
      >
        <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
        <span>
          Hay {errorCount} {errorCount === 1 ? 'campo' : 'campos'} por completar.
          Revisa los marcados en rojo.
        </span>
      </div>
    )}

    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className={BTN_SECONDARY}>
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={saving || submitDisabled}
        className={BTN_PRIMARY}
      >
        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  </div>
);
