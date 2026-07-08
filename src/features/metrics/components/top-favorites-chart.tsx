/**
 * @file top-favorites-chart.tsx
 * @description Lista jerárquica (ranked list) con barras embebidas para
 * visualizar los productos con más usuarios en favoritos.
 *
 * Comparte el mismo patrón visual que `products-by-category-chart.tsx` para
 * que ambas tarjetas del panel de métricas se vean consistentes: cada fila
 * muestra el nombre del producto, una barra proporcional y el conteo.
 *
 * Recibe puntos ya ordenados descendentemente desde el servicio. La barra de
 * cada fila se dimensiona de forma relativa al valor máximo (el primero, por
 * venir ordenado desc). El shell padre maneja el estado `empty` cuando no hay
 * datos.
 */

import { useMemo } from 'react';

import type { TopFavoritePoint } from '@/features/metrics/types/product-metrics.types';

interface TopFavoritesChartProps {
  /** Puntos a graficar, ordenados desc por `favoritesCount`. */
  data: TopFavoritePoint[];
}

// ─── Formateadores ────────────────────────────────────────────────────────────

const countFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

/**
 * Formatea la cantidad de favoritos como un número entero localizado.
 *
 * @param value - Conteo asociado al producto.
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
 * Renderiza el top de productos con más favoritos como una lista ordenada
 * con barras proporcionales embebidas. La card padre acota la altura: cuando
 * hay más filas de las que caben, la lista hace scroll interno sin alterar la
 * altura total de la tarjeta.
 *
 * @param data - Puntos a graficar, ordenados desc por `favoritesCount`.
 * @returns Lista lista para insertarse dentro del shell de métricas.
 */
export function TopFavoritesChart({ data }: TopFavoritesChartProps) {
  const maxCount = useMemo(
    () => data.reduce((acc, point) => Math.max(acc, point.favoritesCount), 0),
    [data],
  );

  return (
    <ol
      className="flex max-h-72 w-full min-w-0 flex-col gap-3 overflow-y-auto pr-1 sm:max-h-80"
      aria-label="Productos con más usuarios en favoritos"
    >
      {data.map((point) => {
        const ratio = maxCount > 0 ? point.favoritesCount / maxCount : 0;
        const width =
          point.favoritesCount > 0
            ? Math.max(MIN_BAR_WIDTH_PCT, ratio * 100)
            : 0;

        return (
          <li key={point.productId} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="min-w-0 flex-1 truncate"
                title={point.name}
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-secondary)',
                }}
              >
                {point.name}
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
                {formatCount(point.favoritesCount)}
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
