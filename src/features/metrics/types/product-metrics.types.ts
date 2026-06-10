/**
 * @file product-metrics.types.ts
 * @description Tipos TypeScript para las métricas derivadas de los endpoints
 * de productos del backend.
 *
 * Cubre los contratos de:
 * - `GET /products/stats?agrupar=estado`     → KPIs y distribución por estado
 * - `GET /products/stats?agrupar=categoria`  → Distribución por categoría
 * - `GET /products/favorites/top?limit=N`    → Top de productos favoritos
 */

// ─── Respuesta cruda del backend ──────────────────────────────────────────────

/**
 * Estados de producto que maneja el backend.
 * Se replica aquí para evitar dependencia directa de Prisma desde el frontend.
 */
export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

/**
 * Estructura del campo `data` que devuelve `GET /products/stats`.
 * `porCategoria` y `porEstado` son mutuamente excluyentes y dependen del
 * parámetro `agrupar` enviado en la petición.
 */
export interface ProductStatsResponseData {
  /** Total de productos contabilizados con los filtros aplicados. */
  totalProductos: number;
  /** Conteo por nombre de categoría. Presente cuando `agrupar=categoria`. */
  porCategoria?: Record<string, number>;
  /** Conteo por estado. Presente cuando `agrupar=estado` (solo admin). */
  porEstado?: Partial<Record<ProductStatus, number>>;
}

/**
 * Envoltorio estándar de respuestas exitosas del backend para `/products/stats`.
 */
export interface ProductStatsResponse {
  success: true;
  data: ProductStatsResponseData;
  message?: string;
}

/**
 * Punto individual del top de productos favoritos tal como lo devuelve
 * `GET /products/favorites/top`.
 */
export interface TopFavoriteProductApi {
  /** UUID del producto. */
  productId: string;
  /** Nombre visible del producto. */
  name: string;
  /** Número de usuarios que tienen el producto en favoritos. */
  favoritesCount: number;
}

/**
 * Respuesta estándar del backend para el top de favoritos.
 */
export interface TopFavoritesResponse {
  success: true;
  data: TopFavoriteProductApi[];
  message?: string;
}

// ─── DTOs internos del frontend ──────────────────────────────────────────────

/**
 * Resumen de estados consumido por las tarjetas KPI.
 * `total` viene de `totalProductos` y los demás se derivan de `porEstado`.
 */
export interface ProductStatusSummary {
  /** Total de productos en el catálogo (incluye ocultos). */
  total: number;
  /** Productos visibles al público. */
  available: number;
  /** Productos agotados. */
  outOfStock: number;
  /** Productos ocultos. */
  hidden: number;
}

/**
 * Punto consumido por la gráfica de productos por categoría.
 * Ya viene ordenado descendentemente por `count` desde el servicio.
 */
export interface CategoryCountPoint {
  /** Nombre legible de la categoría. */
  category: string;
  /** Cantidad de productos asociados. */
  count: number;
}

/**
 * Punto consumido por la gráfica de top favoritos.
 */
export interface TopFavoritePoint {
  /** UUID del producto (sirve como `key` estable en listas). */
  productId: string;
  /** Nombre visible del producto. */
  name: string;
  /** Cantidad de usuarios que lo tienen en favoritos. */
  favoritesCount: number;
}
