/**
 * @file discount-amount-input.tsx
 * @description Input compacto para capturar un valor de descuento en COP con
 * **formateo de miles en tiempo real**, pensado para caber en filas estrechas
 * (las filas de la lista de descuentos y el panel del modal selector).
 *
 * ## Cómo funciona
 * Replica la mecánica de `AdditionalValueField` de los formularios de producto:
 * el padre almacena solo los dígitos crudos (ej. `"200000"`), este componente
 * los muestra siempre formateados (`"200.000"`) — incluso mientras se escribe —
 * y en `onChange` devuelve de vuelta los dígitos ya limpios.
 *
 * A diferencia de `AdditionalValueField` (un campo ancho con prefijo "COP $"
 * pensado para formularios), aquí el prefijo es un escueto `$` y el ancho es
 * reducido para encajar en una fila junto a los botones Guardar / Quitar.
 *
 * @see additional-value-field.tsx — equivalente para los formularios de producto.
 */

import {
  formatThousands,
  stripFormatting,
} from '@/features/catalog/components/product-form/utils';

interface DiscountAmountInputProps {
  /** `id` del input, para enlazar una `<label>` externa si se necesita. */
  id?: string;
  /** Dígitos crudos almacenados por el padre (ej. `"200000"`). */
  value: string;
  /** Recibe los dígitos limpios ya extraídos del texto escrito. */
  onChange: (digits: string) => void;
  /** Deshabilita el input mientras hay una mutación en curso. */
  disabled?: boolean;
  /** Pinta el borde en color de error cuando la validación falla. */
  hasError?: boolean;
  placeholder?: string;
}

/**
 * Input con prefijo `$` que formatea los miles en vivo.
 */
export const DiscountAmountInput = ({
  id,
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder = '0',
}: DiscountAmountInputProps) => (
  // El `<label>` envuelve todo el control para que cualquier click dentro del
  // recuadro (no solo sobre el `<input>`) enfoque el campo. Antes el input tenía
  // ancho fijo y solo reaccionaba al hacer click en su zona izquierda.
  <label
    htmlFor={id}
    className="flex w-full cursor-text items-center overflow-hidden rounded-[var(--radius-sm)] border"
    style={{
      borderColor: hasError
        ? 'var(--danger, #c0392b)'
        : 'var(--border-color)',
      backgroundColor: 'var(--bg-primary)',
    }}
  >
    <span
      aria-hidden="true"
      className="pl-2"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
      }}
    >
      $
    </span>
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={formatThousands(value)}
      disabled={disabled}
      onChange={(e) => onChange(stripFormatting(e.target.value))}
      placeholder={placeholder}
      className="min-w-0 flex-1 px-2 py-2 text-[var(--text-sm)] disabled:opacity-60"
      style={{
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-primary)',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
      }}
    />
  </label>
);
