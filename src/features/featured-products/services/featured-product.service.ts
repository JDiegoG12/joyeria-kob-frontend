/**
 * @file featured-product.service.ts
 * @description Servicio HTTP para el módulo de productos destacados de Joyería KOB.
 *
 * Centraliza todas las llamadas al backend relacionadas con los productos que
 * aparecen en la sección "Productos destacados" de la página de inicio.
 *
 * ## Endpoints cubiertos
 * - `GET    /featured-products`            → Listado público ordenado por position
 * - `POST   /featured-products`            → Agrega un destacado (requiere ADMIN)
 * - `DELETE /featured-products/:productId` → Elimina un destacado (requiere ADMIN)
 * - `PUT    /featured-products/reorder`    → Reordena (requiere ADMIN)
 *
 * ## Convenciones
 * - Todas las funciones son estáticas: no se requiere instanciar la clase.
 * - El servicio devuelve solo el `data` desempaquetado del envoltorio
 *   `{ success, data, message }` que usa el backend.
 * - Los errores se propagan tal como los devuelve Axios para que la capa
 *   superior (el store) pueda inspeccionar `status` y `code`.
 *
 * @see featured-product.store.ts — capa de estado global que consume este servicio.
 */

import { apiClient } from '@/api/api-client';
import type {
  FeaturedProductWithProduct,
  ReorderFeaturedProductsPayload,
} from '@/features/featured-products/types/featured-product.types';

// ─── Tipos de respuesta del backend ───────────────────────────────────────────

/**
 * Envoltorio estándar `{ success, data, message }` que usa el backend
 * para todas las respuestas REST del módulo.
 */
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

/**
 * Servicio de productos destacados.
 * Métodos estáticos — no requiere instanciación.
 */
export class FeaturedProductService {
  /**
   * Obtiene todos los productos destacados ordenados por `position` ascendente.
   * Endpoint público: no requiere autenticación.
   *
   * @returns Array de destacados con el `product` embebido y `calculatedPrice` listo.
   *          Puede ser un array vacío si el admin aún no configuró ninguno.
   *
   * @example
   * ```typescript
   * const featured = await FeaturedProductService.getAll();
   * featured.forEach(({ position, product }) =>
   *   console.log(`#${position}: ${product.name}`));
   * ```
   */
  static async getAll(): Promise<FeaturedProductWithProduct[]> {
    const response =
      await apiClient.get<ApiEnvelope<FeaturedProductWithProduct[]>>(
        '/featured-products',
      );
    return response.data.data ?? [];
  }

  /**
   * Agrega un producto a la lista de destacados.
   * El backend le asigna automáticamente la última posición disponible.
   *
   * Requiere rol ADMIN — el token JWT se adjunta vía interceptor.
   *
   * @param productId - UUID del producto a destacar. Debe estar en estado `AVAILABLE`.
   * @returns El destacado recién creado con el producto y precio embebidos.
   *
   * @throws Error 400 si el producto no está disponible o ya hay 6 destacados.
   * @throws Error 404 si el producto no existe.
   * @throws Error 409 si el producto ya está destacado.
   */
  static async add(productId: string): Promise<FeaturedProductWithProduct> {
    const response = await apiClient.post<
      ApiEnvelope<FeaturedProductWithProduct>
    >('/featured-products', { productId });
    return response.data.data;
  }

  /**
   * Elimina un producto de la lista de destacados.
   * El backend recompacta automáticamente las posiciones restantes.
   *
   * Requiere rol ADMIN.
   *
   * @param productId - UUID del producto a quitar de los destacados.
   *
   * @throws Error 404 si el producto no estaba destacado.
   */
  static async remove(productId: string): Promise<void> {
    await apiClient.delete(`/featured-products/${productId}`);
  }

  /**
   * Reordena la lista completa de destacados.
   *
   * **Importante**: el backend exige enviar TODOS los destacados con posiciones
   * contiguas 1..N. No admite reordenamientos parciales. La capa superior debe
   * garantizar que `items` contenga todos los destacados actuales.
   *
   * Requiere rol ADMIN.
   *
   * @param items - Array con cada destacado y su nueva posición.
   *                Las posiciones deben ser únicas, contiguas y empezar en 1.
   * @returns El listado actualizado tras aplicar el nuevo orden.
   *
   * @throws Error 400 si hay posiciones duplicadas o no contiguas.
   * @throws Error 404 si alguno de los productos no está destacado.
   *
   * @example
   * ```typescript
   * // Mover el destacado de posición 3 a posición 1
   * const updated = await FeaturedProductService.reorder([
   *   { productId: 'uuid-3', position: 1 },
   *   { productId: 'uuid-1', position: 2 },
   *   { productId: 'uuid-2', position: 3 },
   * ]);
   * ```
   */
  static async reorder(
    items: ReorderFeaturedProductsPayload,
  ): Promise<FeaturedProductWithProduct[]> {
    const response = await apiClient.put<
      ApiEnvelope<FeaturedProductWithProduct[]>
    >('/featured-products/reorder', items);
    return response.data.data ?? [];
  }
}