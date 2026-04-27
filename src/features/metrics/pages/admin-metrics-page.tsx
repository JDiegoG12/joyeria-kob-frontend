/**
 * @file admin-metrics-page.tsx
 * @description Página principal del módulo de métricas del panel admin.
 *
 * ## Estructura
 * - Encabezado de página consistente con los módulos admin existentes.
 * - Selector de rango para el histórico del precio del oro.
 * - Card de gráfica responsive con estados de carga, error y vacío.
 *
 * ## Ruta
 * `/admin/metricas` — protegida por `ProtectedRoute` con rol `ADMIN`.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { GoldPriceChart } from '@/features/metrics/components/gold-price-chart';
import { getGoldPriceHistory } from '@/features/metrics/services/metrics.service';
import type {
  GoldPriceHistoryRange,
  GoldPricePoint,
} from '@/features/metrics/types/metrics.types';

const RANGE_OPTIONS: Array<{
  label: string;
  value: GoldPriceHistoryRange;
}> = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1A', value: '1A' },
];

// ─── Página ───────────────────────────────────────────────────────────────────

/**
 * Página de métricas del panel administrativo.
 * Carga y visualiza el histórico del precio del oro según el rango elegido.
 */
export const AdminMetricsPage = () => {
  const [range, setRange] = useState<GoldPriceHistoryRange>('1M');
  const [data, setData] = useState<GoldPricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (selectedRange: GoldPriceHistoryRange) => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await getGoldPriceHistory(selectedRange);
      setData(history);
    } catch {
      setError('No se pudo cargar el histórico del precio del oro.');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory(range);
  }, [range]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex-1">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            Métricas
          </h1>
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Visualiza métricas clave del negocio y su evolución en el tiempo.
          </p>
        </div>

        <RangeSelector value={range} onChange={setRange} />
      </motion.div>

      {/* ── Contenido principal ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
        aria-labelledby="gold-price-history-title"
        className="chart-card w-full min-w-0 rounded-2xl p-4 sm:p-5 lg:p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
              }}
            >
              <BarChart3 size={20} aria-hidden="true" />
            </div>

            <div>
              <p
                className="mb-1"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-muted)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                }}
              >
                Indicadores financieros
              </p>
              <h2
                id="gold-price-history-title"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  lineHeight: 'var(--leading-tight)',
                }}
              >
                Histórico del precio del oro
              </h2>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                }}
              >
                Rango seleccionado: {range}
              </p>
            </div>
          </div>

          {!isLoading && error && (
            <RetryButton onRetry={() => void loadHistory(range)} />
          )}
        </div>

        {isLoading && <ChartSkeleton />}

        {!isLoading && error && <ErrorState message={error} />}

        {!isLoading && !error && data.length === 0 && <EmptyState />}

        {!isLoading && !error && data.length > 0 && (
          <GoldPriceChart data={data} />
        )}
      </motion.section>
    </div>
  );
};

// ─── Subcomponente: selector de rango ────────────────────────────────────────

interface RangeSelectorProps {
  value: GoldPriceHistoryRange;
  onChange: (value: GoldPriceHistoryRange) => void;
}

/**
 * Control segmentado para elegir el rango del histórico.
 */
const RangeSelector = ({ value, onChange }: RangeSelectorProps) => (
  <div
    className="grid w-full grid-cols-4 rounded-xl border p-1 sm:w-auto"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-color)',
    }}
    aria-label="Rango del histórico"
  >
    {RANGE_OPTIONS.map((option) => {
      const isActive = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className="cursor-pointer rounded-lg px-3 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:min-w-14"
          style={{
            backgroundColor: isActive ? 'var(--accent)' : 'transparent',
            color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: isActive
              ? 'var(--font-semibold)'
              : 'var(--font-medium)',
          }}
          aria-pressed={isActive}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

// ─── Subcomponente: loading ──────────────────────────────────────────────────

/**
 * Skeleton estable para reservar el espacio del chart durante la carga.
 */
const ChartSkeleton = () => (
  <div className="h-80 w-full animate-pulse rounded-xl">
    <div
      className="h-full w-full rounded-xl"
      style={{
        background:
          'linear-gradient(90deg, var(--bg-tertiary), var(--bg-primary), var(--bg-tertiary))',
      }}
    />
  </div>
);

// ─── Subcomponente: error ────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string;
}

/**
 * Estado de error dentro de la card de gráfica.
 */
const ErrorState = ({ message }: ErrorStateProps) => (
  <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 text-center">
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)',
        color: 'var(--color-error)',
      }}
    >
      <AlertCircle size={22} aria-hidden="true" />
    </div>
    <p
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
      }}
    >
      Error al cargar métricas
    </p>
    <p
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
      }}
    >
      {message}
    </p>
  </div>
);

// ─── Subcomponente: vacío ────────────────────────────────────────────────────

/**
 * Estado vacío cuando el backend responde sin puntos para el rango elegido.
 */
const EmptyState = () => (
  <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 text-center">
    <BarChart3 size={30} style={{ color: 'var(--text-muted)' }} />
    <p
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
      }}
    >
      Sin datos para este rango
    </p>
    <p
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
      }}
    >
      Cuando existan registros históricos aparecerán en esta gráfica.
    </p>
  </div>
);

// ─── Subcomponente: reintento ────────────────────────────────────────────────

interface RetryButtonProps {
  onRetry: () => void;
}

/**
 * Acción de reintento para errores de carga.
 */
const RetryButton = ({ onRetry }: RetryButtonProps) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onRetry}
    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-colors sm:w-auto"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)',
      backgroundColor: 'transparent',
    }}
    onHoverStart={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor =
        'var(--bg-hover)';
    }}
    onHoverEnd={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
    }}
  >
    <RefreshCw size={15} aria-hidden="true" />
    Intentar de nuevo
  </motion.button>
);
