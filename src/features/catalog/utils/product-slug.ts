/**
 * @file product-slug.ts
 * @description Generación y parseo del slug de producto para la ruta pública
 * `/producto/:slug`.
 *
 * ## Formato del slug
 * ```
 * <nombre-en-slug>-<id>
 * ej: anillo-buho-oro-18k-f47ac10b-58cc-4372-a567-0e02b2c3d479
 * ```
 *
 * El slug se compone del nombre del producto convertido a slug (minúsculas,
 * sin tildes, espacios → guiones) seguido del `id` del producto.
 *
 * ## Por qué el id completo (UUID) y no un id corto de 6 caracteres
 * El backend solo expone búsqueda por UUID completo (`GET /products/:id`); no
 * existe un endpoint que resuelva un id corto ni un slug. Para que una visita
 * directa a `/producto/:slug` (sin pasar por el catálogo) pueda cargar el
 * producto, el slug debe contener el identificador que el backend sí entiende.
 * Usar el UUID completo:
 *   1. Funciona con la API actual sin tocar el backend (Fase 1 = solo frontend).
 *   2. Garantiza unicidad absoluta (cero colisiones entre nombres repetidos).
 * Si en una fase posterior se añade un endpoint `by-slug`/`by-short-id` en el
 * backend, basta con cambiar {@link buildProductSlug} y {@link extractProductId}.
 */

import type { Product } from '@/features/catalog/types/product.types';

/**
 * Patrón de un UUID v4 anclado al final de la cadena. Se usa para extraer el
 * `id` del producto de un slug, ignorando la parte del nombre (que también
 * contiene guiones).
 */
const TRAILING_UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Convierte un texto a un slug seguro para URL.
 *
 * - Separa y elimina los diacríticos (tildes, diéresis) vía normalización NFD.
 * - Pasa a minúsculas.
 * - Reemplaza cualquier secuencia de caracteres no alfanuméricos por un guion.
 * - Recorta los guiones sobrantes en los extremos.
 *
 * @param text - Texto a convertir (p. ej. el nombre del producto).
 * @returns Slug en minúsculas separado por guiones, ej. `anillo-buho-oro-18k`.
 */
export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // elimina diacríticos descompuestos por NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Construye el slug de un producto: `<nombre-en-slug>-<id>`.
 * Si el nombre quedara vacío tras slugificar (caso límite), devuelve solo el id.
 *
 * @param product - Producto (basta con `name` e `id`).
 * @returns Slug listo para la ruta `/producto/:slug`.
 */
export const buildProductSlug = (
  product: Pick<Product, 'name' | 'id'>,
): string => {
  const base = slugify(product.name);
  return base ? `${base}-${product.id}` : product.id;
};

/**
 * Construye la ruta completa al detalle de un producto.
 *
 * @param product - Producto (basta con `name` e `id`).
 * @returns Ruta `/producto/<slug>` para usar en `<Link to>`.
 */
export const buildProductPath = (
  product: Pick<Product, 'name' | 'id'>,
): string => `/producto/${buildProductSlug(product)}`;

/**
 * Extrae el `id` (UUID) de un slug de producto.
 *
 * @param slug - Slug recibido del router, ej. `anillo-buho-oro-18k-<uuid>`.
 * @returns El UUID si el slug contiene uno al final; `null` en caso contrario.
 */
export const extractProductId = (slug: string): string | null => {
  const match = slug.match(TRAILING_UUID_RE);
  return match ? match[0] : null;
};
