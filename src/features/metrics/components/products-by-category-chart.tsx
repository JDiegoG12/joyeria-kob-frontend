/**
 * @file products-by-category-chart.tsx
 * @description Lista jerárquica (ranked list) con barras embebidas para
 * visualizar la distribución de productos por categoría.
 *
 * Sustituye al antiguo `BarChart` horizontal de Recharts: con muchas
 * categorías la gráfica crecía sin tope y descompensaba el grid del panel.
 * Esta lista mantiene una altura acotada (scroll interno) y muestra todas
 * las categorías con producto sin importar cuántas sean, legible por igual
 * en escritorio y móvil.
 *
 * Consume los puntos ya ordenados descendentemente que entrega
 * `product-metrics.service.ts`. La barra de cada fila se dimensiona de forma
 * relativa al valor máximo (la primera categoría, por venir ordenada desc).
 */

import { useMemo } from 'react';

import type { CategoryCountPoint } from '@/features/metrics/types/product-metrics.types';

interface ProductsByCategoryChartProps {
  /** Puntos a graficar. Ya vienen ordenados descendentemente por `count`. */
  data: CategoryCountPoint[];
}

// ─── Formateadores ────────────────────────────────────────────────────────────

const countFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

/**
 * Formatea el conteo de productos como un número entero localizado.
 *
 * @param value - Cantidad asociada a una categoría.
 * @returns Cadena lista para mostrar al usuario.
 */
function formatCount(value: number): string {
  return countFormatter.format(value);
}

/**
 * Ancho mínimo (en %) que se le da a una barra con valor mayor a cero para
 * que siga siendo visible aunque su proporción real sea muy pequeña.
 */
const MIN_BAR_WIDTH_PCT = 6;

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Renderiza la distribución de productos por categoría como una lista
 * ordenada con barras proporcionales embebidas. La card padre acota la
 * altura: cuando hay más filas de las que caben, la lista hace scroll
 * interno sin alterar la altura total de la tarjeta.
 *
 * @param data - Puntos a graficar, ordenados desc por `count`.
 * @returns Lista lista para insertarse dentro del shell de métricas.
 */
export function ProductsByCategoryChart({ data }: ProductsByCategoryChartProps) {
  const maxCount = useMemo(
    () => data.reduce((acc, point) => Math.max(acc, point.count), 0),
    [data],
  );

  return (
    <ol
      className="flex max-h-72 w-full min-w-0 flex-col gap-3 overflow-y-auto pr-1 sm:max-h-80"
      aria-label="Distribución de productos por categoría"
    >
      {data.map((point) => {
        const ratio = maxCount > 0 ? point.count / maxCount : 0;
        const width =
          point.count > 0
            ? Math.max(MIN_BAR_WIDTH_PCT, ratio * 100)
            : 0;

        return (
          <li key={point.category} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="min-w-0 flex-1 truncate"
                title={point.category}
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-secondary)',
                }}
              >
                {point.category}
              </span>
              <span
                className="shrink-0 tabular-nums"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                }}
              >
                {formatCount(point.count)}
              </span>
            </div>

            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: 'var(--accent-vivid, var(--accent))',
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
