/**
 * @file admin-metrics-page.tsx
 * @description Página principal del módulo de métricas del panel admin.
 *
 * ## Estructura visual
 * 1. Encabezado de página con título y botón global de refresco.
 * 2. Grid de tarjetas KPI (total y disponibles).
 * 3. Histórico del precio del oro ocupando ancho completo.
 * 4. Grid responsive con la distribución por categoría y el top de favoritos.
 *
 * En móvil todas las cards se apilan a 1 columna y heredan el header
 * compacto del {@link MetricsCardShell}. En desktop los KPIs se acomodan
 * a 2 columnas y las gráficas inferiores en 2 columnas (1 columna en
 * tablet/<lg).
 *
 * ## Carga de datos
 * Las cuatro fuentes (oro, KPIs, categorías, favoritos) se disparan en
 * paralelo con `Promise.allSettled`, de manera que un fallo en una no
 * bloquea la carga del resto. Cada widget mantiene su propio estado
 * (`loading | error | empty | ready`) y expone un reintento local.
 *
 * El botón global "Actualizar" del encabezado vuelve a disparar todas
 * las cargas a la vez.
 *
 * ## Ruta
 * `/admin/metricas` — protegida por `ProtectedRoute` con rol `ADMIN`.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  CheckCircle2,
  PieChart,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { GoldPriceChart } from '@/features/metrics/components/gold-price-chart';
import { KpiCard } from '@/features/metrics/components/kpi-card';
import { MetricsCardShell } from '@/features/metrics/components/metrics-card-shell';
import { ProductsByCategoryChart } from '@/features/metrics/components/products-by-category-chart';
import { TopFavoritesChart } from '@/features/metrics/components/top-favorites-chart';

import { getGoldPriceHistory } from '@/features/metrics/services/metrics.service';
import {
  getProductCategoryCounts,
  getProductStatusSummary,
  getTopFavoriteProducts,
} from '@/features/metrics/services/product-metrics.service';

import type {
  GoldPriceHistoryRange,
  GoldPricePoint,
} from '@/features/metrics/types/metrics.types';
import type {
  CategoryCountPoint,
  ProductStatusSummary,
  TopFavoritePoint,
} from '@/features/metrics/types/product-metrics.types';

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Cantidad de productos a recuperar para la gráfica de top favoritos.
 * Coincide con el plan aprobado: top 5.
 */
const TOP_FAVORITES_LIMIT = 5;

const RANGE_OPTIONS: Array<{
  label: string;
  value: GoldPriceHistoryRange;
}> = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1A', value: '1A' },
];

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

/**
 * Estado genérico de una métrica asincrónica. Cada widget mantiene su
 * propio estado para que un error en una fuente no contamine al resto.
 *
 * @template T - Tipo del dato exitoso esperado.
 */
interface AsyncResource<T> {
  status: 'loading' | 'error' | 'ready';
  data: T | null;
  error: string | null;
}

/**
 * Construye un estado inicial en `loading` para un recurso asincrónico.
 */
function buildInitialResource<T>(): AsyncResource<T> {
  return { status: 'loading', data: null, error: null };
}

// ─── Página ───────────────────────────────────────────────────────────────────

/**
 * Página principal del módulo de métricas. Orquesta la carga paralela
 * de todas las fuentes y delega el render visual a los componentes
 * especializados.
 */
export const AdminMetricsPage = () => {
  const [range, setRange] = useState<GoldPriceHistoryRange>('1M');

  const [goldPrice, setGoldPrice] = useState<AsyncResource<GoldPricePoint[]>>(
    buildInitialResource,
  );
  const [statusSummary, setStatusSummary] = useState<
    AsyncResource<ProductStatusSummary>
  >(buildInitialResource);
  const [categoryCounts, setCategoryCounts] = useState<
    AsyncResource<CategoryCountPoint[]>
  >(buildInitialResource);
  const [topFavorites, setTopFavorites] = useState<
    AsyncResource<TopFavoritePoint[]>
  >(buildInitialResource);

  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // ── Cargas individuales ────────────────────────────────────────────────────

  const loadGoldPrice = useCallback(
    async (selectedRange: GoldPriceHistoryRange) => {
      setGoldPrice({ status: 'loading', data: null, error: null });
      try {
        const history = await getGoldPriceHistory(selectedRange);
        setGoldPrice({ status: 'ready', data: history, error: null });
      } catch {
        setGoldPrice({
          status: 'error',
          data: null,
          error: 'No se pudo cargar el histórico del precio del oro.',
        });
      }
    },
    [],
  );

  const loadStatusSummary = useCallback(async () => {
    setStatusSummary({ status: 'loading', data: null, error: null });
    try {
      const summary = await getProductStatusSummary();
      setStatusSummary({ status: 'ready', data: summary, error: null });
    } catch {
      setStatusSummary({
        status: 'error',
        data: null,
        error: 'No se pudieron cargar los indicadores de productos.',
      });
    }
  }, []);

  const loadCategoryCounts = useCallback(async () => {
    setCategoryCounts({ status: 'loading', data: null, error: null });
    try {
      const counts = await getProductCategoryCounts();
      setCategoryCounts({ status: 'ready', data: counts, error: null });
    } catch {
      setCategoryCounts({
        status: 'error',
        data: null,
        error: 'No se pudo cargar la distribución por categoría.',
      });
    }
  }, []);

  const loadTopFavorites = useCallback(async () => {
    setTopFavorites({ status: 'loading', data: null, error: null });
    try {
      const favorites = await getTopFavoriteProducts(TOP_FAVORITES_LIMIT);
      setTopFavorites({ status: 'ready', data: favorites, error: null });
    } catch {
      setTopFavorites({
        status: 'error',
        data: null,
        error: 'No se pudo cargar el top de productos favoritos.',
      });
    }
  }, []);

  // ── Refresco global ───────────────────────────────────────────────────────

  /**
   * Dispara todas las cargas en paralelo. Usa `Promise.allSettled` para
   * mantener la UI consistente aunque alguna fuente falle.
   */
  const refreshAll = useCallback(
    async (selectedRange: GoldPriceHistoryRange) => {
      setIsRefreshingAll(true);
      await Promise.allSettled([
        loadGoldPrice(selectedRange),
        loadStatusSummary(),
        loadCategoryCounts(),
        loadTopFavorites(),
      ]);
      setIsRefreshingAll(false);
    },
    [loadGoldPrice, loadStatusSummary, loadCategoryCounts, loadTopFavorites],
  );

  // ── Efectos ───────────────────────────────────────────────────────────────

  /**
   * Carga inicial al montar y cada vez que el usuario cambia el rango del
   * histórico del oro. Solo recarga la fuente de oro: los otros widgets
   * no dependen del rango.
   */
  useEffect(() => {
    void loadGoldPrice(range);
  }, [range, loadGoldPrice]);

  /**
   * Carga inicial de los widgets que no dependen del rango. Se ejecuta
   * una sola vez al montar la página.
   */
  useEffect(() => {
    void loadStatusSummary();
    void loadCategoryCounts();
    void loadTopFavorites();
  }, [loadStatusSummary, loadCategoryCounts, loadTopFavorites]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <PageHeader
        isRefreshing={isRefreshingAll}
        onRefresh={() => void refreshAll(range)}
      />

      <div className="flex flex-col gap-4 sm:gap-6">
        <KpiRow
          resource={statusSummary}
          onRetry={() => void loadStatusSummary()}
        />

        <GoldPriceSection
          resource={goldPrice}
          range={range}
          onChangeRange={setRange}
          onRetry={() => void loadGoldPrice(range)}
        />

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <CategorySection
            resource={categoryCounts}
            onRetry={() => void loadCategoryCounts()}
          />
          <TopFavoritesSection
            resource={topFavorites}
            onRetry={() => void loadTopFavorites()}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Subcomponente: encabezado de página ─────────────────────────────────────

interface PageHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

/**
 * Encabezado de la página con título, descripción y botón global de
 * refresco. Mantiene la jerarquía tipográfica usada en el resto del panel.
 */
const PageHeader = ({ isRefreshing, onRefresh }: PageHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="mb-6 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between"
  >
    <div className="max-w-3xl">
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

    <RefreshAllButton onClick={onRefresh} isRefreshing={isRefreshing} />
  </motion.div>
);

interface RefreshAllButtonProps {
  onClick: () => void;
  isRefreshing: boolean;
}

/**
 * Botón global del encabezado para refrescar todas las métricas a la vez.
 * El ícono gira mientras hay cargas en curso.
 */
const RefreshAllButton = ({ onClick, isRefreshing }: RefreshAllButtonProps) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    disabled={isRefreshing}
    aria-label="Actualizar todas las métricas"
    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)',
      backgroundColor: 'transparent',
    }}
  >
    <RefreshCw
      size={15}
      aria-hidden="true"
      className={isRefreshing ? 'animate-spin' : undefined}
    />
    {isRefreshing ? 'Actualizando…' : 'Actualizar'}
  </motion.button>
);

// ─── Subcomponente: fila de KPIs ─────────────────────────────────────────────

interface KpiRowProps {
  resource: AsyncResource<ProductStatusSummary>;
  onRetry: () => void;
}

/**
 * Fila de tarjetas KPI con el total de productos y los disponibles.
 *
 * Ambas tarjetas comparten el mismo recurso para evitar dos peticiones:
 * el endpoint `/products/stats?agrupar=estado` ya devuelve total y
 * conteos por estado en una sola respuesta. Si la carga falla, se
 * renderiza un placeholder discreto que invita a reintentar globalmente
 * desde el botón del encabezado.
 */
const KpiRow = ({ resource, onRetry }: KpiRowProps) => {
  const cardState =
    resource.status === 'ready'
      ? 'ready'
      : resource.status === 'error'
        ? 'error'
        : 'loading';

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
      <KpiCard
        label="Total de productos"
        icon={Boxes}
        state={cardState}
        value={resource.data?.total ?? 0}
        hint="Incluye disponibles, sin stock y ocultos"
        animationDelay={0.05}
      />
      <KpiCard
        label="Productos disponibles"
        icon={CheckCircle2}
        state={cardState}
        value={resource.data?.available ?? 0}
        hint="Visibles al público en el catálogo"
        animationDelay={0.1}
      />

      {resource.status === 'error' ? (
        <KpiRetryHint message={resource.error} onRetry={onRetry} />
      ) : null}
    </div>
  );
};

interface KpiRetryHintProps {
  message: string | null;
  onRetry: () => void;
}

/**
 * Indicador inline mostrado debajo de los KPIs cuando la petición falla.
 * Mantiene la fila visible pero invita a reintentar sin abandonar la página.
 */
const KpiRetryHint = ({ message, onRetry }: KpiRetryHintProps) => (
  <div
    className="flex flex-col items-start gap-2 rounded-xl border border-dashed px-4 py-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between"
    style={{
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
    }}
  >
    <p
      className="m-0"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
      }}
    >
      {message ?? 'No se pudieron cargar los indicadores.'}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="cursor-pointer rounded-lg px-3 py-1.5 transition-colors"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        color: 'var(--text-accent)',
        backgroundColor: 'var(--accent-subtle)',
      }}
    >
      Reintentar
    </button>
  </div>
);

// ─── Subcomponente: sección del histórico del oro ────────────────────────────

interface GoldPriceSectionProps {
  resource: AsyncResource<GoldPricePoint[]>;
  range: GoldPriceHistoryRange;
  onChangeRange: (value: GoldPriceHistoryRange) => void;
  onRetry: () => void;
}

/**
 * Sección con el histórico del precio del oro y su selector de rango.
 * El selector siempre se renderiza dentro del header del shell para
 * que el usuario pueda cambiar de rango incluso en estado de error.
 */
const GoldPriceSection = ({
  resource,
  range,
  onChangeRange,
  onRetry,
}: GoldPriceSectionProps) => {
  const cardState =
    resource.status === 'loading'
      ? 'loading'
      : resource.status === 'error'
        ? 'error'
        : (resource.data?.length ?? 0) === 0
          ? 'empty'
          : 'ready';

  return (
    <MetricsCardShell
      icon={TrendingUp}
      sectionLabel="Indicadores financieros"
      title="Histórico del precio del oro"
      description="Evolución histórica del valor por gramo con referencia temporal."
      titleId="gold-price-history-title"
      state={cardState}
      errorMessage={resource.error ?? undefined}
      emptyMessage="Cuando existan registros históricos aparecerán en esta gráfica."
      onRetry={onRetry}
      animationDelay={0.15}
      headerActions={
        <RangeSelector value={range} onChange={onChangeRange} />
      }
    >
      {resource.data ? <GoldPriceChart data={resource.data} /> : null}
    </MetricsCardShell>
  );
};

interface RangeSelectorProps {
  value: GoldPriceHistoryRange;
  onChange: (value: GoldPriceHistoryRange) => void;
}

/**
 * Control segmentado para elegir el rango del histórico del oro.
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
          className="cursor-pointer rounded-lg px-3 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:min-w-14"
          style={{
            backgroundColor: isActive
              ? 'var(--accent-vivid, var(--accent))'
              : 'transparent',
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

// ─── Subcomponente: sección de categorías ────────────────────────────────────

interface CategorySectionProps {
  resource: AsyncResource<CategoryCountPoint[]>;
  onRetry: () => void;
}

/**
 * Sección con la distribución de productos por categoría.
 * El backend agrupa por `categoryId` directo: si un producto vive en una
 * subcategoría, se contabilizará bajo ella (no bajo la raíz). Eso es lo
 * que el endpoint expone hoy y lo que reflejamos sin alterar.
 */
const CategorySection = ({ resource, onRetry }: CategorySectionProps) => {
  const cardState =
    resource.status === 'loading'
      ? 'loading'
      : resource.status === 'error'
        ? 'error'
        : (resource.data?.length ?? 0) === 0
          ? 'empty'
          : 'ready';

  return (
    <MetricsCardShell
      icon={PieChart}
      sectionLabel="Catálogo"
      title="Productos por categoría"
      description="Cantidad de productos asociados a cada categoría del catálogo."
      titleId="products-by-category-title"
      state={cardState}
      errorMessage={resource.error ?? undefined}
      emptyMessage="Aún no hay productos asociados a las categorías existentes."
      onRetry={onRetry}
      animationDelay={0.2}
    >
      {resource.data ? <ProductsByCategoryChart data={resource.data} /> : null}
    </MetricsCardShell>
  );
};

// ─── Subcomponente: sección de top favoritos ─────────────────────────────────

interface TopFavoritesSectionProps {
  resource: AsyncResource<TopFavoritePoint[]>;
  onRetry: () => void;
}

/**
 * Sección con el top de productos con más usuarios en favoritos.
 */
const TopFavoritesSection = ({
  resource,
  onRetry,
}: TopFavoritesSectionProps) => {
  const cardState =
    resource.status === 'loading'
      ? 'loading'
      : resource.status === 'error'
        ? 'error'
        : (resource.data?.length ?? 0) === 0
          ? 'empty'
          : 'ready';

  return (
    <MetricsCardShell
      icon={Sparkles}
      sectionLabel="Favoritos"
      title={`Top ${TOP_FAVORITES_LIMIT} productos favoritos`}
      description="Los productos disponibles que más usuarios tienen en favoritos."
      titleId="top-favorites-title"
      state={cardState}
      errorMessage={resource.error ?? undefined}
      emptyMessage="Cuando los clientes empiecen a guardar favoritos, aparecerán aquí."
      onRetry={onRetry}
      animationDelay={0.25}
    >
      {resource.data ? <TopFavoritesChart data={resource.data} /> : null}
    </MetricsCardShell>
  );
};
