/**
 * @file product-metrics.service.ts
 * @description Servicio HTTP para las métricas del módulo administrativo
 * basadas en los endpoints de productos del backend.
 *
 * ## Endpoints que consume
 * - `GET /products/stats?agrupar=estado`     → KPIs por estado (admin)
 * - `GET /products/stats?agrupar=categoria`  → Conteo por categoría (admin)
 * - `GET /products/favorites/top?limit=N`    → Top productos favoritos (admin)
 *
 * Todas las peticiones se autentican automáticamente con el JWT inyectado
 * por `apiClient`. Las funciones devuelven DTOs ya normalizados y listos
 * para alimentar gráficas y tarjetas KPI sin lógica adicional.
 */

import { apiClient } from '@/api/api-client';
import type {
  CategoryCountPoint,
  ProductStatsResponse,
  ProductStatusSummary,
  TopFavoritePoint,
  TopFavoritesResponse,
} from '@/features/metrics/types/product-metrics.types';

const PRODUCT_STATS_ENDPOINT = '/products/stats';
const TOP_FAVORITES_ENDPOINT = '/products/favorites/top';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte la respuesta agrupada por estado en el resumen consumido por las
 * tarjetas KPI. Si el backend omite alguna llave, se asume `0`.
 *
 * @param data - Bloque `data` recibido de `GET /products/stats?agrupar=estado`.
 * @returns Resumen con totales y conteos por estado.
 */
function mapStatusSummary(
  data: ProductStatsResponse['data'],
): ProductStatusSummary {
  const porEstado = data.porEstado ?? {};

  return {
    total: data.totalProductos,
    available: porEstado.AVAILABLE ?? 0,
    outOfStock: porEstado.OUT_OF_STOCK ?? 0,
    hidden: porEstado.HIDDEN ?? 0,
  };
}

/**
 * Convierte la respuesta agrupada por categoría en una lista ordenada
 * descendentemente por cantidad. Las categorías sin productos se descartan.
 *
 * @param data - Bloque `data` recibido de `GET /products/stats?agrupar=categoria`.
 * @returns Puntos listos para una gráfica de barras horizontales.
 */
function mapCategoryCounts(
  data: ProductStatsResponse['data'],
): CategoryCountPoint[] {
  const porCategoria = data.porCategoria ?? {};

  return Object.entries(porCategoria)
    .map(([category, count]) => ({ category, count }))
    .filter((point) => point.count > 0)
    .sort((current, next) => next.count - current.count);
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

/**
 * Servicio de métricas de productos del panel administrativo.
 */
export const ProductMetricsService = {
  /**
   * Obtiene el resumen de productos agrupado por estado.
   * El backend devuelve `totalProductos` y `porEstado`; aquí se normaliza
   * para que las tarjetas KPI no tengan que manejar llaves opcionales.
   *
   * @returns Resumen con total y conteos por estado.
   * @throws Error de red o de servidor si la petición falla.
   *
   * @example
   * ```typescript
   * const summary = await ProductMetricsService.getStatusSummary();
   * console.log(summary.total, summary.available);
   * ```
   */
  getStatusSummary: async (): Promise<ProductStatusSummary> => {
    const response = await apiClient.get<ProductStatsResponse>(
      PRODUCT_STATS_ENDPOINT,
      { params: { agrupar: 'estado' } },
    );

    return mapStatusSummary(response.data.data);
  },

  /**
   * Obtiene el conteo de productos agrupado por categoría.
   * Devuelve la lista ordenada descendentemente para que la gráfica
   * pueda renderizarla directamente.
   *
   * @returns Lista de categorías con su cantidad de productos.
   * @throws Error de red o de servidor si la petición falla.
   */
  getCategoryCounts: async (): Promise<CategoryCountPoint[]> => {
    const response = await apiClient.get<ProductStatsResponse>(
      PRODUCT_STATS_ENDPOINT,
      { params: { agrupar: 'categoria' } },
    );

    return mapCategoryCounts(response.data.data);
  },

  /**
   * Obtiene el top de productos con más usuarios en favoritos.
   *
   * @param limit - Cantidad máxima de productos a recuperar. El backend
   *                acepta valores entre 1 y 50. Por defecto `5`.
   * @returns Lista de productos ordenados por `favoritesCount` desc.
   * @throws Error de red o de servidor si la petición falla.
   */
  getTopFavorites: async (limit = 5): Promise<TopFavoritePoint[]> => {
    const response = await apiClient.get<TopFavoritesResponse>(
      TOP_FAVORITES_ENDPOINT,
      { params: { limit } },
    );

    return response.data.data.map((point) => ({
      productId: point.productId,
      name: point.name,
      favoritesCount: point.favoritesCount,
    }));
  },
};

// ─── Exports por caso de uso ──────────────────────────────────────────────────

/**
 * Obtiene el resumen de productos agrupado por estado.
 * Export directo para consumidores que prefieren funciones por caso de uso
 * en lugar del objeto `ProductMetricsService`.
 */
export const getProductStatusSummary = (): Promise<ProductStatusSummary> =>
  ProductMetricsService.getStatusSummary();

/**
 * Obtiene el conteo de productos agrupado por categoría.
 */
export const getProductCategoryCounts = (): Promise<CategoryCountPoint[]> =>
  ProductMetricsService.getCategoryCounts();

/**
 * Obtiene el top de productos con más favoritos.
 *
 * @param limit - Cantidad máxima de productos a recuperar.
 */
export const getTopFavoriteProducts = (
  limit?: number,
): Promise<TopFavoritePoint[]> => ProductMetricsService.getTopFavorites(limit);
