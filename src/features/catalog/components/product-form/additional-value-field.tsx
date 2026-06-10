/**
 * @file additional-value-field.tsx
 * @description Campo "valor adicional (COP)" con prefijo monetario y formateo
 * de miles EN TIEMPO REAL, replicando la experiencia de `gold-price-card`.
 *
 * ## Cómo funciona
 * El formulario almacena solo los dígitos crudos (ej: `"1200000"`). Este
 * componente los muestra siempre formateados (`"1.200.000"`) — incluso mientras
 * se escribe — y en `onChange` devuelve los dígitos ya limpios al padre.
 *
 * Antes el campo solo formateaba al perder el foco (`onBlur`); ahora reformatea
 * en cada tecla, que es más cómodo y consistente con el campo del precio del oro.
 */

import { formatThousands, stripFormatting } from './utils';

interface AdditionalValueFieldProps {
  /** `id` del input (para `htmlFor` de la etiqueta y el scroll-a-error). */
  id?: string;
  /** Dígitos crudos almacenados en el estado del formulario. */
  value: string;
  /** Recibe los dígitos limpios ya extraídos del texto escrito. */
  onChange: (digits: string) => void;
  placeholder?: string;
}

/**
 * Input con prefijo "COP $" que formatea los miles en tiempo real.
 */
export const AdditionalValueField = ({
  id,
  value,
  onChange,
  placeholder = '1.200.000',
}: AdditionalValueFieldProps) => (
  <div className="flex overflow-hidden rounded-xl border border-[var(--border-color)] bg-transparent transition hover:border-[var(--border-strong)] focus-within:ring-2 focus-within:ring-[var(--accent)]">
    {/* Prefijo visual — no interactivo */}
    <span
      aria-hidden="true"
      className="flex flex-shrink-0 items-center border-r border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 text-sm font-medium text-[var(--text-muted)]"
    >
      COP $
    </span>

    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={formatThousands(value)}
      onChange={(e) => onChange(stripFormatting(e.target.value))}
      placeholder={placeholder}
      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
    />
  </div>
);
