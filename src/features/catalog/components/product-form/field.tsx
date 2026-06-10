/**
 * @file field.tsx
 * @description Envoltorio de campo de formulario: etiqueta, hint opcional y
 * mensaje de error inline. Compartido por ambos formularios de joyas.
 *
 * El error se anuncia con `role="alert"` para lectores de pantalla, y el hint
 * se oculta cuando hay error para no competir por la atención.
 */

import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  /**
   * `id` del control asociado. Conecta la etiqueta (`htmlFor`) con el input y
   * sirve como destino del scroll-a-error.
   */
  htmlFor?: string;
  children: ReactNode;
}

/**
 * Campo con etiqueta, hint opcional y error inline.
 */
export const Field = ({
  label,
  error,
  required = false,
  hint,
  htmlFor,
  children,
}: FieldProps) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium text-[var(--text-primary)]"
    >
      {label}
      {required && (
        <span className="ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
    {children}
    {hint && !error && (
      <p className="text-xs text-[var(--text-muted)]">{hint}</p>
    )}
    {error && (
      <p className="text-xs text-red-500" role="alert">
        {error}
      </p>
    )}
  </div>
);
