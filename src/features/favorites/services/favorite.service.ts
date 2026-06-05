/**
 * @file favorite.service.ts
 * @description Servicio HTTP para operaciones CRUD sobre favoritos de Joyería KOB.
 *
 * ## Endpoints que consume
 * - `GET    /api/favorites`               → Listar favoritos del usuario (solo AVAILABLE)
 * - `POST   /api/favorites`               → Agregar producto a favoritos
 * - `DELETE /api/favorites/:productId`    → Eliminar producto de favoritos
 *
 * ## Autenticación
 * Todos los endpoints requieren JWT. El `apiClient` de Axios
 * inyecta automáticamente el Bearer token en cada petición.
 */

import { apiClient } from '@/api/api-client';
import type {
  FavoriteItem,
  FavoritesListResponse,
  FavoriteAddResponse,
  FavoriteRemoveResponse,
} from '../types/favorite.types';

export const favoriteService = {
  /**
   * Obtiene la lista completa de favoritos del usuario autenticado.
   * El backend filtra automáticamente productos no disponibles (HIDDEN/OUT_OF_STOCK).
   *
   * @returns Array de favoritos con el producto completo anidado.
   */
  async getAll(): Promise<FavoriteItem[]> {
    const response = await apiClient.get<FavoritesListResponse>('/favorites');
    return response.data.data ?? [];
  },

  /**
   * Agrega un producto a la lista de favoritos del usuario.
   *
   * @param productId - UUID del producto a agregar.
   * @returns El favorito recién creado con el producto anidado.
   * @throws 409 si el producto ya está en favoritos.
   */
  async add(productId: string): Promise<FavoriteItem> {
    const response = await apiClient.post<FavoriteAddResponse>('/favorites', {
      productId,
    });
    return response.data.data;
  },

  /**
   * Elimina un producto de la lista de favoritos del usuario.
   *
   * @param productId - UUID del producto a eliminar.
   */
  async remove(productId: string): Promise<void> {
    await apiClient.delete<FavoriteRemoveResponse>(`/favorites/${productId}`);
  },
};
