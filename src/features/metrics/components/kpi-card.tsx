/**
 * @file kpi-card.tsx
 * @description Tarjeta KPI reutilizable para los indicadores resumen del
 * módulo de métricas.
 *
 * Maneja sus propios estados visuales (loading, error, ready) para que la
 * página pueda renderizar una fila de KPIs sin envolverlos en otros
 * wrappers. Está optimizada para apilarse en móvil (grid 1 columna) y
 * acomodarse en grid 2/4 columnas en breakpoints superiores.
 */

import { motion } from 'framer-motion';
import { AlertCircle, type LucideIcon } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Estado actual de la tarjeta KPI. Se diferencia de
 * {@link './metrics-card-shell'.MetricsCardState} porque las tarjetas KPI no
 * tienen estado `empty`: un total de cero es un dato válido y debe mostrarse.
 */
export type KpiCardState = 'loading' | 'error' | 'ready';

interface KpiCardProps {
  /** Etiqueta corta del indicador (ej. "Total de productos"). */
  label: string;
  /** Valor numérico a mostrar. Se ignora si `state !== 'ready'`. */
  value: number;
  /** Ícono representativo del indicador. */
  icon: LucideIcon;
  /** Estado actual de la tarjeta. */
  state: KpiCardState;
  /** Subtítulo opcional con contexto (ej. "Incluye ocultos"). */
  hint?: string;
  /** Retraso de la animación de entrada en segundos. */
  animationDelay?: number;
}

// ─── Formateador de números ───────────────────────────────────────────────────

const numberFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

/**
 * Aplica el formato de número con separador de miles en español colombiano.
 *
 * @param value - Valor numérico recibido del backend.
 * @returns Cadena lista para mostrar al usuario.
 */
function formatKpiValue(value: number): string {
  return numberFormatter.format(value);
}

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Tarjeta KPI con encabezado compacto, valor destacado y estados explícitos
 * para carga y error.
 *
 * @param props - Configuración del indicador.
 * @returns Tarjeta lista para insertarse en el grid de KPIs.
 */
export const KpiCard = ({
  label,
  value,
  icon: Icon,
  state,
  hint,
  animationDelay = 0,
}: KpiCardProps) => (
  <motion.article
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: animationDelay, duration: 0.25 }}
    className="flex w-full min-w-0 flex-col gap-3 rounded-2xl p-4 sm:p-5"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <header className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'var(--accent-subtle)',
          color: 'var(--accent-vivid, var(--accent))',
        }}
      >
        <Icon size={18} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="m-0 truncate"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-muted)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </p>
      </div>
    </header>

    <KpiBody state={state} value={value} hint={hint} />
  </motion.article>
);

// ─── Subcomponente: cuerpo según estado ──────────────────────────────────────

interface KpiBodyProps {
  state: KpiCardState;
  value: number;
  hint?: string;
}

/**
 * Renderiza el contenido principal de la tarjeta según su estado.
 *
 * @internal Solo se usa dentro de {@link KpiCard}.
 */
const KpiBody = ({ state, value, hint }: KpiBodyProps) => {
  if (state === 'loading') {
    return <KpiSkeleton />;
  }

  if (state === 'error') {
    return <KpiError />;
  }

  return (
    <div className="min-w-0">
      <p
        className="m-0"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(var(--text-2xl), 6vw, var(--text-3xl))',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {formatKpiValue(value)}
      </p>

      {hint ? (
        <p
          className="m-0 mt-1"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
};

// ─── Subcomponente: skeleton ─────────────────────────────────────────────────

/**
 * Placeholder animado mostrado mientras se resuelve la petición HTTP.
 */
const KpiSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-2">
    <div
      className="h-8 w-24 rounded-md"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />
    <div
      className="h-3 w-16 rounded-md"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />
  </div>
);

// ─── Subcomponente: error inline ─────────────────────────────────────────────

/**
 * Indicador inline mostrado cuando la petición HTTP falla.
 */
const KpiError = () => (
  <div
    className="flex items-center gap-2"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-error)',
    }}
  >
    <AlertCircle size={16} aria-hidden="true" />
    Sin datos
  </div>
);
