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
 * Entrada de favorito tal como la devuelve `GET /api/favorites`.
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

/**
 * Favorito "pelado" tal como lo devuelve `POST /api/favorites`.
 *
 * A diferencia del `GET`, el endpoint de creación NO incluye el `product`
 * anidado: solo confirma el registro recién creado. Por eso este tipo omite
 * `product` — el consumidor (store) reconcilia estos datos sobre su item
 * optimista y obtiene el producto completo más tarde vía `GET`.
 */
export type FavoriteRecord = Omit<FavoriteItem, 'product'>;

// ─── Respuestas del backend ───────────────────────────────────────────────────

export interface FavoritesListResponse {
  success: boolean;
  data: FavoriteItem[];
  message: string;
}

export interface FavoriteAddResponse {
  success: boolean;
  /** El `POST` devuelve el favorito sin el `product` anidado. */
  data: FavoriteRecord;
  message: string;
}

export interface FavoriteRemoveResponse {
  success: boolean;
  message: string;
}
