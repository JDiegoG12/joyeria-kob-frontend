/**
 * @file filter.types.ts
 * @description Tipos del sistema de filtros del catálogo de Joyería KOB.
 *
 * ## Jerarquía de categorías
 * ```
 * Categoría principal (ej: Anillos)
 *   └── Subcategoría (ej: Compromiso, Solitarios)
 * ```
 * Una joya pertenece a UNA categoría principal y puede tener
 * UNA O VARIAS subcategorías dentro de esa misma categoría.
 *
 * ## Relación con el store de filtros
 * `CatalogFilters` es la forma del estado activo en `filter.store.ts`.
 * Cuando el usuario selecciona filtros, se actualiza ese estado
 * y el catálogo reacciona automáticamente.
 */

/** Subcategoría perteneciente a una categoría principal. */
export interface SubCategory {
    /** Identificador único de la subcategoría. */
    id: string;
    /** Nombre para mostrar en el sidebar. */
    label: string;
}

/**
 * Categoría principal de joyas.
 * Contiene sus propias subcategorías anidadas.
 *
 * @example
 * ```typescript
 * const categoria: JewelryCategory = {
 *   id: 'anillos',
 *   label: 'Anillos',
 *   subCategories: [
 *     { id: 'compromiso', label: 'Compromiso' },
 *     { id: 'solitarios', label: 'Solitarios' },
 *   ],
 * };
 * ```
 */
export interface JewelryCategory {
    /** Identificador único de la categoría. */
    id: string;
    /** Nombre para mostrar en el sidebar. */
    label: string;
    /** Subcategorías que pertenecen a esta categoría. */
    subCategories: SubCategory[];
}

/**
 * Estado activo de los filtros del catálogo.
 * Este es el objeto que se guarda en el store y se envía
 * al servicio para filtrar los productos.
 *
 * ## Combinaciones posibles
 * | categoryId | showAllInCategory | subCategoryIds | Significado                         |
 * |------------|-------------------|----------------|-------------------------------------|
 * | null       | false             | []             | Sin filtro — mostrar todo           |
 * | 'anillos'  | true              | []             | Todos los anillos                   |
 * | 'anillos'  | false             | ['compromiso'] | Solo anillos de compromiso          |
 * | 'anillos'  | false             | ['c','s']      | Compromiso y solitarios             |
 *
 * @example
 * ```typescript
 * // Ver todos los anillos
 * const filters: CatalogFilters = {
 *   categoryId: 'anillos',
 *   showAllInCategory: true,
 *   subCategoryIds: [],
 * };
 *
 * // Ver solo anillos de compromiso y solitarios
 * const filters: CatalogFilters = {
 *   categoryId: 'anillos',
 *   showAllInCategory: false,
 *   subCategoryIds: ['compromiso', 'solitarios'],
 * };
 * ```
 */
export interface CatalogFilters {
    /**
     * ID de la categoría principal seleccionada.
     * `null` significa sin filtro de categoría activo — mostrar todo.
     */
    categoryId: string | null;

    /**
     * Cuando es `true`, el catálogo muestra todos los productos de
     * `categoryId` sin importar la subcategoría.
     * Cuando es `false`, solo se muestran los de `subCategoryIds`.
     */
    showAllInCategory: boolean;

    /**
     * IDs de las subcategorías seleccionadas.
     * Solo aplica cuando `showAllInCategory` es `false`.
     * Array vacío + showAllInCategory=false = sin filtro activo.
     */
    subCategoryIds: string[];
}