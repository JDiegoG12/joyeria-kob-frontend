/**
 * @file product.types.ts
 * @description Tipos TypeScript para el dominio de productos (joyas)
 * de Joyería KOB.
 *
 * ## Regla de negocio sobre categoryId
 * Una joya siempre guarda un único `categoryId`. Si la joya pertenece a una
 * subcategoría, se guarda el ID de la subcategoría. Si pertenece directamente
 * a una categoría principal, se guarda el ID de esa categoría.
 *
 * ## Resolución de categoría en el formulario de edición
 * El backend devuelve `product.category` con su `parentId` y el objeto `parent`
 * completo. Esto permite inicializar el selector de dos pasos sin peticiones extra:
 * ```
 * Si product.category.parentId === null
 *   → Es categoría raíz: parentId = product.category.id, subId = null
 * Si product.category.parentId !== null
 *   → Es subcategoría: parentId = product.category.parentId, subId = product.category.id
 * ```
 *
 * ## Fórmula de precio
 * El precio no se envía al crear o editar — el backend lo calcula usando:
 * ```
 * calculatedPrice = baseWeight × goldPricePerGram + additionalValue
 * ```
 */

// ─── Enums y literales ────────────────────────────────────────────────────────

/** Estados posibles de visibilidad de un producto en el catálogo. */
export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

// ─── Entidades ────────────────────────────────────────────────────────────────

/**
 * Categoría padre simplificada que acompaña a una subcategoría en la respuesta
 * del backend. No incluye `children` ni `parent` para evitar recursión infinita.
 */
export interface ParentCategory {
  id: number;
  name: string;
  slug: string;
  /** Siempre `null` porque es una categoría raíz. */
  parentId: null;
}

/**
 * Categoría completa tal como la devuelve el backend dentro de un producto.
 * Incluye `parentId` y el objeto `parent` para poder resolver el selector de
 * dos pasos en el formulario de edición sin peticiones adicionales al backend.
 *
 * @example
 * ```typescript
 * // Subcategoría "Solitarios" hija de "Anillos"
 * {
 *   id: 30,
 *   name: 'Solitarios',
 *   slug: 'solitarios',
 *   parentId: 1,
 *   parent: { id: 1, name: 'Anillos', slug: 'anillos', parentId: null }
 * }
 *
 * // Categoría raíz "Anillos"
 * { id: 1, name: 'Anillos', slug: 'anillos', parentId: null, parent: null }
 * ```
 */
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  /**
   * `null` si es categoría raíz, número si es subcategoría.
   * Este campo es la clave para inicializar el selector de dos pasos.
   */
  parentId: number | null;
  /**
   * Objeto de la categoría padre. `null` si es categoría raíz.
   * Presente en la respuesta del backend para evitar una petición extra.
   */
  parent: ParentCategory | null;
}

/**
 * Especificaciones técnicas de una joya.
 * Son un mapa de clave-valor flexible que varía según el tipo de joya.
 *
 * @example
 * ```typescript
 * // Anillo con talla y piedras
 * { requiresSize: true, sizes: ['6', '7', '8'], stoneType: 'Zafiro' }
 *
 * // Collar sin talla
 * { hasStones: false, material: 'Oro 18k' }
 * ```
 */
export interface ProductSpecifications {
  requiresSize?: boolean;
  sizes?: string[];
  stones?: string[];
  [key: string]: unknown;
}

/** Producto completo tal como lo devuelve el backend. */
export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: number;
  /** Categoría con parentId y parent anidado para resolución del selector. */
  category?: ProductCategory;
  baseWeight: number;
  additionalValue: number;
  calculatedPrice: number;
  stock: number;
  status: ProductStatus;
  images: string[];
  specifications: ProductSpecifications;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Payloads de mutación ─────────────────────────────────────────────────────

/**
 * Payload para crear un nuevo producto.
 * Todos los campos son obligatorios. El precio se calcula en el backend.
 * Las imágenes se envían como archivos reales en un FormData multipart.
 */
export interface CreateProductPayload {
  name: string;
  description: string;
  /** ID de la subcategoría (si aplica) o de la categoría principal. */
  categoryId: number;
  /** Peso en gramos. Admite decimales. */
  baseWeight: number;
  /** Valor adicional en COP (materiales extra, piedras, mano de obra). */
  additionalValue: number;
  /** Unidades disponibles en inventario. Debe ser entero ≥ 0. */
  stock: number;
  /** Especificaciones técnicas como mapa de clave-valor. */
  specifications: ProductSpecifications;
  /** Entre 1 y 5 archivos de imagen reales. */
  imageFiles: File[];
}

/**
 * Payload para actualizar un producto existente.
 * Todos los campos son opcionales — solo se envían los que cambian.
 */
export interface UpdateProductPayload {
  name?: string;
  description?: string;
  categoryId?: number;
  baseWeight?: number;
  additionalValue?: number;
  stock?: number;
  status?: ProductStatus;
  specifications?: ProductSpecifications;
  imageFiles?: File[];
  imagesToDelete?: string[];
}