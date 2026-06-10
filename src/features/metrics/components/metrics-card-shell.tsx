/**
 * @file metrics-card-shell.tsx
 * @description Wrapper visual común para las tarjetas de métricas del panel
 * administrativo.
 *
 * Centraliza el encabezado (ícono, etiqueta de sección, título y descripción),
 * el manejo de estados de carga/error/vacío y el botón de reintento. Mantiene
 * el aspecto consistente con la card original del histórico del precio del oro
 * y aplica un header compacto en móvil para reducir el scroll antes de la
 * gráfica.
 *
 * Cada gráfica del módulo de métricas debe envolverse en este shell para
 * heredar estados consistentes, animaciones y estilos basados en los tokens
 * de diseño globales.
 */

import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Estado actual de la tarjeta. Controla qué bloque se renderiza dentro del
 * área de contenido del shell.
 */
export type MetricsCardState = 'loading' | 'error' | 'empty' | 'ready';

interface MetricsCardShellProps {
  /** Ícono principal mostrado a la izquierda del encabezado. */
  icon: LucideIcon;
  /** Etiqueta breve mostrada arriba del título (ej. "Catálogo"). */
  sectionLabel: string;
  /** Título principal de la tarjeta. */
  title: string;
  /** Descripción corta del contenido. */
  description: string;
  /** Identificador único usado por `aria-labelledby`. */
  titleId: string;
  /** Estado actual de la tarjeta. */
  state: MetricsCardState;
  /** Mensaje a mostrar en estado `error`. */
  errorMessage?: string;
  /** Mensaje a mostrar en estado `empty`. */
  emptyMessage?: string;
  /** Callback ejecutado al pulsar el botón de reintento en estado `error`. */
  onRetry?: () => void;
  /**
   * Slot opcional para controles colocados a la derecha del encabezado
   * (ej. selector de rango del histórico del oro). Se oculta cuando el
   * estado es `error` para dar prioridad al botón de reintento.
   */
  headerActions?: ReactNode;
  /** Retraso de la animación de entrada en segundos. */
  animationDelay?: number;
  /** Clases extra para el contenedor raíz. */
  className?: string;
  /** Contenido renderizado cuando el estado es `ready`. */
  children: ReactNode;
}

// ─── Componente principal ────────────────────────────────────────────────────

/**
 * Tarjeta envoltorio reutilizable para las visualizaciones del módulo
 * de métricas. Aplica padding, borde, sombra y header consistente, y
 * delega al consumidor únicamente el contenido del estado `ready`.
 *
 * @param props - Configuración del header, estado actual y contenido.
 * @returns Sección animada lista para insertar en el grid de la página.
 */
export const MetricsCardShell = ({
  icon: Icon,
  sectionLabel,
  title,
  description,
  titleId,
  state,
  errorMessage,
  emptyMessage,
  onRetry,
  headerActions,
  animationDelay = 0,
  className = '',
  children,
}: MetricsCardShellProps) => (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: animationDelay, duration: 0.3 }}
    aria-labelledby={titleId}
    className={`chart-card w-full min-w-0 rounded-2xl p-4 sm:p-5 lg:p-6 ${className}`.trim()}
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <CardHeader
      icon={Icon}
      sectionLabel={sectionLabel}
      title={title}
      description={description}
      titleId={titleId}
      headerActions={state === 'error' ? null : headerActions}
      retryButton={
        state === 'error' && onRetry ? (
          <RetryButton onRetry={onRetry} />
        ) : null
      }
    />

    {state === 'loading' && <ChartSkeleton />}

    {state === 'error' && (
      <ErrorState
        message={errorMessage ?? 'No se pudo cargar la información.'}
      />
    )}

    {state === 'empty' && (
      <EmptyState
        message={emptyMessage ?? 'Aún no hay datos para esta métrica.'}
      />
    )}

    {state === 'ready' && children}
  </motion.section>
);

// ─── Subcomponente: encabezado ───────────────────────────────────────────────

interface CardHeaderProps {
  icon: LucideIcon;
  sectionLabel: string;
  title: string;
  description: string;
  titleId: string;
  headerActions: ReactNode;
  retryButton: ReactNode;
}

/**
 * Encabezado de la tarjeta. En móvil oculta la etiqueta de sección y la
 * descripción para dejar más espacio a la gráfica; en `sm:` y superior
 * muestra la versión completa.
 */
const CardHeader = ({
  icon: Icon,
  sectionLabel,
  title,
  description,
  titleId,
  headerActions,
  retryButton,
}: CardHeaderProps) => (
  <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:flex"
          style={{
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent-vivid, var(--accent))',
          }}
        >
          <Icon size={20} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p
            className="mb-1 hidden sm:block"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-muted)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            {sectionLabel}
          </p>

          <div className="flex items-center gap-2 sm:block">
            <Icon
              size={18}
              aria-hidden="true"
              className="flex-shrink-0 sm:hidden"
              style={{ color: 'var(--accent-vivid, var(--accent))' }}
            />
            <h2
              id={titleId}
              className="text-base sm:text-lg"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {title}
            </h2>
          </div>

          <p
            className="mt-1 hidden sm:block"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {retryButton}
    </div>

    {headerActions ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {headerActions}
      </div>
    ) : null}
  </div>
);

// ─── Subcomponente: loading ──────────────────────────────────────────────────

/**
 * Skeleton estable que reserva el espacio del contenido durante la carga.
 * La altura mínima se ajusta al breakpoint para coincidir con la altura
 * típica de las gráficas del módulo.
 */
const ChartSkeleton = () => (
  <div className="h-56 w-full animate-pulse overflow-hidden rounded-xl sm:h-64">
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
 * Bloque renderizado cuando la carga del servicio falla.
 * El reintento se delega al `MetricsCardShell` mediante `onRetry`.
 */
const ErrorState = ({ message }: ErrorStateProps) => (
  <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 text-center sm:min-h-64">
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full"
      style={{
        backgroundColor:
          'color-mix(in srgb, var(--color-error) 12%, transparent)',
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

interface EmptyStateProps {
  message: string;
}

/**
 * Bloque renderizado cuando el backend responde correctamente pero no hay
 * datos relevantes para la métrica.
 */
const EmptyState = ({ message }: EmptyStateProps) => (
  <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 text-center sm:min-h-64">
    <BarChart3 size={30} style={{ color: 'var(--text-muted)' }} />
    <p
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
      }}
    >
      Sin datos disponibles
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

// ─── Subcomponente: reintento ────────────────────────────────────────────────

interface RetryButtonProps {
  onRetry: () => void;
}

/**
 * Botón de reintento mostrado en el encabezado cuando ocurre un error.
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
  >
    <RefreshCw size={15} aria-hidden="true" />
    Intentar de nuevo
  </motion.button>
);
