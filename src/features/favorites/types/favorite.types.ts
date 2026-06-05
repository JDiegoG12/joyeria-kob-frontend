/**
 * @file favorite.types.ts
 * @description Tipos TypeScript para el dominio de favoritos de Joyería KOB.
 *
 * Refleja exactamente la forma del payload que devuelve
 * `GET /api/favorites` y `POST /api/favorites`.
 */

import type { Product } from '@/features/catalog/types/product.types';

// ─── Entidades ────────────────────────────────────────────────────────────────

/**
 * Entrada de favorito tal como la devuelve el backend.
 * El backend solo retorna productos con status AVAILABLE.
 */
export interface FavoriteItem {
  /** ID numérico del registro de favorito. */
  id: number;
  /** UUID del usuario propietario. */
  userId: string;
  /** UUID del producto marcado como favorito. */
  productId: string;
  /** Fecha de creación del favorito. */
  createdAt: string;
  /** Producto completo con categoría anidada. */
  product: Product;
}

// ─── Respuestas del backend ───────────────────────────────────────────────────

export interface FavoritesListResponse {
  success: boolean;
  data: FavoriteItem[];
  message: string;
}

export interface FavoriteAddResponse {
  success: boolean;
  data: FavoriteItem;
  message: string;
}

export interface FavoriteRemoveResponse {
  success: boolean;
  message: string;
}
