/**
 * @file featured-product.types.ts
 * @description Tipos TypeScript del dominio de productos destacados de Joyería KOB.
 *
 * Un "producto destacado" es una referencia ordenada a un producto del catálogo
 * que aparece en la sección principal de la página de inicio. El admin puede
 * agregar/quitar/reordenar hasta `MAX_FEATURED_PRODUCTS` (6).
 *
 * ## Modelo del backend
 * La entidad `FeaturedProduct` solo guarda `id`, `productId` y `position`. Al
 * consultarla, el backend siempre embebe el `product` completo y le agrega
 * `calculatedPrice` (precio calculado con el oro vigente).
 *
 * ## Forma de los endpoints consumidos
 * - `GET    /featured-products`            → `FeaturedProductWithProduct[]`
 * - `POST   /featured-products`            → `FeaturedProductWithProduct` (admin)
 * - `DELETE /featured-products/:productId` → `void` (admin)
 * - `PUT    /featured-products/reorder`    → `FeaturedProductWithProduct[]` (admin)
 *
 * @see featured-product.service.ts — capa HTTP que consume estos tipos.
 * @see featured-product.store.ts — estado global construido sobre estos tipos.
 */

import type { Product } from '@/features/catalog/types/product.types';

// ─── Constantes de dominio ────────────────────────────────────────────────────

/**
 * Cantidad máxima de productos destacados que admite el backend.
 * Espejea `MAX_FEATURED_PRODUCTS` del servicio backend para validaciones
 * client-side anticipadas (UI deshabilita "Agregar" al alcanzar el límite).
 */
export const MAX_FEATURED_PRODUCTS = 6;

// ─── Entidades ────────────────────────────────────────────────────────────────

/**
 * Producto destacado tal como lo devuelve el backend, con el `product` completo
 * embebido y el campo `calculatedPrice` ya inyectado en `product`.
 *
 * @remarks
 * El backend agrega `calculatedPrice` al objeto `product` para evitar que el
 * cliente tenga que recalcular el precio combinando peso, valor adicional y
 * precio del oro. Por eso el `product` aquí es el mismo `Product` que devuelve
 * el catálogo público.
 */
export interface FeaturedProductWithProduct {
  /** ID interno autoincremental del registro de destacado. */
  id: number;
  /** UUID del producto al que apunta este destacado. */
  productId: string;
  /**
   * Posición 1-indexada en la lista de destacados.
   * El backend garantiza que las posiciones son contiguas (1..N) y únicas.
   */
  position: number;
  /** Producto completo embebido con `calculatedPrice` ya resuelto. */
  product: Product;
}

// ─── Payloads de mutación ─────────────────────────────────────────────────────

/**
 * Item individual del payload de reordenamiento.
 *
 * El backend exige enviar TODOS los destacados con posiciones contiguas 1..N
 * y sin duplicados — no admite reordenamientos parciales.
 */
export interface ReorderItem {
  /** UUID del producto que ocupará la nueva posición. */
  productId: string;
  /** Nueva posición 1-indexada. Debe formar parte de una secuencia 1..N. */
  position: number;
}

/**
 * Payload completo para `PUT /featured-products/reorder`.
 * Es un arreglo plano de `ReorderItem` — la API no lo envuelve en un objeto.
 */
export type ReorderFeaturedProductsPayload = ReorderItem[];

// ─── Sobre el frontend ────────────────────────────────────────────────────────

/**
 * Helper de tipo para slots vacíos en la UI del admin.
 * Representa una posición sin producto asignado todavía (placeholder visual)
 * para invitar a completar los 6 destacados sin forzarlo.
 */
export interface EmptyFeaturedSlot {
  /** Discriminador para distinguir slots vacíos de destacados reales. */
  kind: 'empty';
  /** Posición visual 1-indexada del slot vacío. */
  position: number;
}

/**
 * Unión discriminada usada por la UI del admin para renderizar la lista mixta
 * de destacados reales + slots vacíos hasta completar `MAX_FEATURED_PRODUCTS`.
 */
export type FeaturedSlot =
  | (FeaturedProductWithProduct & { kind: 'item' })
  | EmptyFeaturedSlot;