/**
 * @file auth-field.tsx
 * @description Campo de formulario reutilizable para las páginas de auth.
 *
 * Unifica el patrón label + input + error y, opcionalmente, el botón de
 * mostrar/ocultar contraseña. Características de diseño:
 * - Esquinas rectas (coherente con el resto de la app KOB).
 * - Foco con borde de acento + halo sutil; transición de 200ms.
 * - Texto a 16px en móvil (`text-base`) para evitar el zoom automático de iOS,
 *   y 14px (`sm:text-sm`) desde tablet.
 * - El pegado de texto está SIEMPRE habilitado (no se bloquea clipboard).
 */

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthFieldProps {
  /** Texto de la etiqueta visible. */
  label: string;
  /** Valor controlado del input. */
  value: string;
  /** Callback con el nuevo valor. */
  onChange: (value: string) => void;
  /** Tipo de input HTML. Ignorado si `isPassword` es true. */
  type?: 'text' | 'email';
  /** Placeholder del input. */
  placeholder?: string;
  /** Valor de `autoComplete`. */
  autoComplete?: string;
  /** Mensaje de error a mostrar bajo el campo. */
  error?: string;
  /** Si es true, renderiza un campo de contraseña con toggle de visibilidad. */
  isPassword?: boolean;
  /**
   * Si es true, impide pegar/arrastrar texto en el campo. Se usa en los campos
   * de confirmación (correo/contraseña) para forzar que el usuario los reescriba
   * y así detectar erratas. Los campos normales SÍ permiten pegar.
   */
  blockPaste?: boolean;
  /** Retraso de la animación de entrada escalonada (ej: '120ms'). */
  animationDelay?: string;
}

export const AuthField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  error,
  isPassword = false,
  blockPaste = false,
  animationDelay,
}: AuthFieldProps) => {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div
      className="animate-fade-in"
      style={animationDelay ? { animationDelay } : undefined}
    >
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium tracking-wide"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          onPaste={blockPaste ? (e) => e.preventDefault() : undefined}
          onDrop={blockPaste ? (e) => e.preventDefault() : undefined}
          className={`w-full border bg-[var(--bg-primary)] px-3.5 py-2.5 text-base text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_22%,transparent)] sm:text-sm ${
            isPassword ? 'pr-11' : ''
          } ${error ? 'border-[var(--color-error)]' : 'border-[var(--border-color)]'}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  );
};
