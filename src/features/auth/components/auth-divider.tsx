/**
 * @file auth-divider.tsx
 * @description Separador horizontal con una etiqueta central ("o" por defecto)
 * para distinguir el formulario de credenciales del acceso con Google.
 * Respeta los tokens de color para ser dark-mode safe.
 */

interface AuthDividerProps {
  /** Texto central del separador. */
  label?: string;
}

export const AuthDivider = ({ label = 'o' }: AuthDividerProps) => {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden="true">
      <span
        className="h-px flex-1"
        style={{ backgroundColor: 'var(--border-color)' }}
      />
      <span
        className="text-xs uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <span
        className="h-px flex-1"
        style={{ backgroundColor: 'var(--border-color)' }}
      />
    </div>
  );
};
