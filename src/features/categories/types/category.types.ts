/**
 * @file category.types.ts
 * @description Tipos TypeScript del módulo de categorías de Joyería KOB.
 * Refleja exactamente el esquema Prisma y los contratos del backend.
 */

// ─── Modelo principal ─────────────────────────────────────────────────────────

/**
 * Categoría tal como la devuelve el backend.
 * Puede ser raíz (`parentId === null`) o subcategoría (`parentId !== null`).
 * El array `children` contiene las subcategorías directas.
 */
export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parentId: number | null;
    createdAt: string;
    parent: CategoryParent | null;
    children: Category[];
}

/**
 * Referencia reducida al padre, tal como la incluye el backend
 * en cada objeto `Category`.
 */
export interface CategoryParent {
    id: number;
    name: string;
    slug: string;
}

// ─── Inputs para mutaciones ───────────────────────────────────────────────────

/**
 * Payload para crear una nueva categoría.
 * `name` y `slug` son obligatorios según el backend.
 * `parentId` convierte la categoría en subcategoría.
 */
export interface CategoryCreateInput {
    name: string;
    slug: string;
    description?: string;
    parentId?: number | null;
}

/**
 * Payload para actualizar una categoría existente.
 * Todos los campos son opcionales — se envían solo los que cambian.
 */
export interface CategoryUpdateInput {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: number | null;
}

// ─── Respuestas del backend ───────────────────────────────────────────────────

/**
 * Envoltorio estándar de respuestas exitosas del backend.
 */
export interface ApiSuccess<T> {
    success: true;
    data: T;
}

/**
 * Envoltorio estándar de respuestas de error del backend.
 */
export interface ApiError {
    success: false;
    error: CategoryErrorCode;
    message: string;
}

/**
 * Códigos de error que puede devolver el backend para categorías.
 */
export type CategoryErrorCode =
    | 'CATEGORY_NOT_FOUND'
    | 'CATEGORY_HAS_CHILDREN'
    | 'CATEGORY_HAS_PRODUCTS'
    | 'SLUG_ALREADY_EXISTS'
    | 'MISSING_FIELDS'
    | 'INVALID_PARENT_ID';

// ─── UI ───────────────────────────────────────────────────────────────────────

/**
 * Modos del Drawer de categorías.
 * - `closed`  → Drawer oculto
 * - `view`    → Detalle de categoría seleccionada (solo lectura)
 * - `edit`    → Formulario precargado para editar la categoría seleccionada
 * - `create`  → Formulario vacío para crear una nueva categoría
 */
export type DrawerMode = 'closed' | 'view' | 'edit' | 'create';