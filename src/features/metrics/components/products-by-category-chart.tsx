/**
 * @file products-by-category-chart.tsx
 * @description Gráfica de barras horizontales para visualizar la distribución
 * de productos por categoría.
 *
 * Consume los puntos ya ordenados descendentemente que entrega
 * `product-metrics.service.ts`. Está pensada para encajar en un grid de 2
 * columnas en desktop y ocupar el ancho completo en móvil.
 */

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';

import type { CategoryCountPoint } from '@/features/metrics/types/product-metrics.types';
import { useIsMobileChart } from '@/features/metrics/hooks/use-is-mobile-chart';

// ─── Constantes de layout ─────────────────────────────────────────────────────

/**
 * Largo máximo del nombre de categoría visible en el eje Y antes de truncar.
 * En móvil se reduce para evitar que el label invada el área de barras.
 */
const MAX_LABEL_LENGTH_DESKTOP = 22;
const MAX_LABEL_LENGTH_MOBILE = 16;

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
 * Acorta el nombre de la categoría si excede el largo máximo permitido.
 * Mantiene el nombre original visible en el tooltip.
 *
 * @param value - Nombre completo de la categoría.
 * @param maxLength - Largo máximo permitido en el eje Y.
 * @returns Cadena recortada con elipsis si fuera necesario.
 */
function truncateLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

// ─── Tooltip personalizado ───────────────────────────────────────────────────

/**
 * Tooltip personalizado que respeta los tokens visuales del módulo.
 *
 * @param props - Estado y payload entregados por Recharts.
 * @returns Contenido del tooltip o `null` cuando no hay barra activa.
 */
function CategoryTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const point = entry.payload as CategoryCountPoint | undefined;
  const count = typeof entry.value === 'number' ? entry.value : null;

  if (!point || count === null) return null;

  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <p
        className="m-0"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-medium)',
          color: 'var(--text-muted)',
        }}
      >
        {point.category}
      </p>
      <p
        className="m-0 mt-1"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
        }}
      >
        {formatCount(count)} producto{count === 1 ? '' : 's'}
      </p>
    </div>
  );
}

// ─── Cálculo de altura responsive ────────────────────────────────────────────

/**
 * Calcula la altura óptima del contenedor en función de la cantidad de barras.
 *
 * Mantiene una altura mínima estable y crece linealmente para evitar barras
 * demasiado finas cuando hay muchas categorías.
 *
 * @param itemCount - Cantidad de categorías a graficar.
 * @param isMobile - Si el viewport está en tamaño móvil.
 * @returns Altura en píxeles para el contenedor.
 */
function getChartHeight(itemCount: number, isMobile: boolean): number {
  const rowHeight = isMobile ? 34 : 40;
  const verticalPadding = isMobile ? 32 : 40;
  const minHeight = isMobile ? 220 : 260;

  return Math.max(minHeight, itemCount * rowHeight + verticalPadding);
}

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Renderiza una gráfica de barras horizontales con la cantidad de productos
 * por categoría. Las barras se animan con `framer-motion` indirectamente a
 * través del shell padre y Recharts maneja la transición interna del SVG.
 *
 * @param data - Puntos a graficar, ordenados desc por `count`.
 * @returns Gráfica lista para insertarse dentro del shell de métricas.
 */
export function ProductsByCategoryChart({ data }: ProductsByCategoryChartProps) {
  const isMobile = useIsMobileChart();

  const maxLabelLength = isMobile
    ? MAX_LABEL_LENGTH_MOBILE
    : MAX_LABEL_LENGTH_DESKTOP;

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        displayLabel: truncateLabel(point.category, maxLabelLength),
      })),
    [data, maxLabelLength],
  );

  const chartHeight = getChartHeight(chartData.length, isMobile);

  const yAxisWidth = useMemo(() => {
    const longest = chartData.reduce(
      (acc, point) => Math.max(acc, point.displayLabel.length),
      0,
    );
    const estimatedWidth = longest * (isMobile ? 6 : 7) + 16;
    const lowerBound = isMobile ? 96 : 110;
    const upperBound = isMobile ? 132 : 168;
    return Math.min(upperBound, Math.max(lowerBound, estimatedWidth));
  }, [chartData, isMobile]);

  return (
    <div className="w-full min-w-0" style={{ height: chartHeight }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={chartHeight}
        initialDimension={{ width: 320, height: chartHeight }}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 8,
            right: isMobile ? 18 : 28,
            bottom: 8,
            left: 0,
          }}
        >
          <CartesianGrid
            stroke="var(--border-color)"
            strokeDasharray="4 8"
            strokeOpacity={0.42}
            horizontal={false}
          />

          <XAxis
            type="number"
            tickFormatter={formatCount}
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-ui)',
            }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />

          <YAxis
            type="category"
            dataKey="displayLabel"
            tick={{
              fill: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-ui)',
            }}
            axisLine={false}
            tickLine={false}
            width={yAxisWidth}
            interval={0}
          />

          <Tooltip
            content={(props) => <CategoryTooltip {...props} />}
            cursor={{
              fill: 'var(--accent-subtle)',
              opacity: 0.6,
            }}
          />

          <Bar
            dataKey="count"
            fill="var(--accent-vivid, var(--accent))"
            radius={[0, 6, 6, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          >
            {chartData.map((point) => (
              <Cell key={point.category} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
