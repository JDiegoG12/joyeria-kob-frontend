/**
 * @file filter.store.ts
 * @description Store de Zustand para gestionar el estado de los filtros
 * activos del catálogo y la lista de categorías disponibles.
 *
 * ## Separación de responsabilidades
 *
 * Este store maneja DOS conceptos distintos que antes estaban mezclados:
 *
 * - **`expandedCategoryId`** (estado de UI): qué categoría está visualmente
 *   abierta en el sidebar para mostrar sus subcategorías. No afecta el
 *   catálogo. El usuario puede abrir/cerrar categorías sin cambiar los filtros.
 *
 * - **`filters`** (estado de datos): qué filtros están aplicados al catálogo.
 *   Solo cambia cuando el usuario selecciona/deselecciona explícitamente.
 *   Incluye `showAllInCategory` para saber si se deben mostrar todos los
 *   ítems de una categoría o solo los de subcategorías específicas.
 *
 * ## Flujo de interacción en el sidebar
 * ```
 * Usuario pulsa categoría "Anillos"
 *   → toggleExpanded('anillos')     expande visualmente
 *   → (filtros no cambian aún)
 *
 * Usuario pulsa "Ver todos los Anillos"
 *   → selectAllInCategory('anillos') activa filtro categoryId='anillos', showAll=true
 *
 * Usuario pulsa subcategoría "Compromiso"
 *   → toggleSubCategory('compromiso') activa filtro subCategoryIds=['compromiso'], showAll=false
 *
 * Usuario pulsa "Solitarios" también
 *   → toggleSubCategory('solitarios') → subCategoryIds=['compromiso','solitarios']
 *
 * Usuario pulsa ← en la categoría para cerrarla
 *   → toggleExpanded('anillos')     colapsa visualmente
 *   → (filtros se mantienen intactos)
 * ```
 *
 * ## Uso en el sidebar de filtros
 * ```tsx
 * import { useFilterStore } from '@/store/filter.store';
 *
 * const {
 *   categories,
 *   filters,
 *   expandedCategoryId,
 *   toggleExpanded,
 *   selectAllInCategory,
 *   toggleSubCategory,
 *   clearFilters,
 * } = useFilterStore();
 * ```
 *
 * ## Uso en el catálogo para reaccionar a los filtros
 * ```tsx
 * const { filters } = useFilterStore();
 *
 * useEffect(() => {
 *   JewelryService.getAll(filters);
 * }, [filters]);
 * ```
 *
 * ## Nota sobre persistencia
 * Este store NO persiste en localStorage intencionalmente.
 * Los filtros se reinician en cada visita para no confundir al usuario.
 */

import { create } from 'zustand';
import { FilterService } from '@/features/catalog/services/filter.service';
import type {
    CatalogFilters,
    JewelryCategory,
} from '@/features/catalog/types/filter.types';

/** Forma del estado y las acciones del store de filtros. */
interface FilterState {
    /**
     * Lista de categorías disponibles cargadas desde el backend.
     * Array vacío mientras se está cargando.
     */
    categories: JewelryCategory[];

    /** Indica si las categorías están siendo cargadas. */
    isLoading: boolean;

    /** Error de carga, si ocurrió alguno. `null` si no hay error. */
    error: string | null;

    /**
     * ID de la categoría actualmente expandida en el sidebar (solo UI).
     * `null` si ninguna está abierta.
     * No tiene ningún efecto en el catálogo — es puramente visual.
     */
    expandedCategoryId: string | null;

    /** Estado actual de los filtros activos aplicados al catálogo. */
    filters: CatalogFilters;

    /**
     * Carga las categorías desde el servicio.
     * Evita cargas duplicadas si ya hay datos en el store.
     *
     * @example
     * ```tsx
     * useEffect(() => {
     *   useFilterStore.getState().loadCategories();
     * }, []);
     * ```
     */
    loadCategories: () => Promise<void>;

    /**
     * Abre o cierra visualmente una categoría en el sidebar.
     * Si la categoría ya está expandida, la colapsa. Si no, la expande
     * y colapsa cualquier otra que estuviera abierta.
     *
     * **No modifica los filtros activos.**
     *
     * @param categoryId - ID de la categoría a expandir/colapsar.
     *
     * @example
     * ```tsx
     * <button onClick={() => toggleExpanded('anillos')}>
     *   Anillos {expandedCategoryId === 'anillos' ? '▲' : '▼'}
     * </button>
     * ```
     */
    toggleExpanded: (categoryId: string) => void;

    /**
     * Activa el filtro "ver todos" para una categoría completa.
     * Limpia las subcategorías seleccionadas y marca `showAllInCategory=true`.
     * Si la categoría ya estaba seleccionada en modo "todos", la deselecciona.
     *
     * @param categoryId - ID de la categoría.
     *
     * @example
     * ```tsx
     * // Botón "Ver todos los Anillos"
     * <button onClick={() => selectAllInCategory('anillos')}>
     *   Ver todos
     * </button>
     * ```
     */
    selectAllInCategory: (categoryId: string) => void;

    /**
     * Activa o desactiva una subcategoría específica.
     * Al activar la primera subcategoría, `showAllInCategory` pasa a `false`
     * automáticamente. Las demás subcategorías previamente seleccionadas
     * se mantienen — permite selección múltiple.
     *
     * @param subCategoryId - ID de la subcategoría a togglear.
     * @param categoryId - ID de la categoría padre. Se usa para asegurarse
     *   de que el filtro de categoría esté activo al seleccionar una subcategoría.
     *
     * @example
     * ```tsx
     * <button onClick={() => toggleSubCategory('compromiso', 'anillos')}>
     *   Compromiso
     * </button>
     * ```
     */
    toggleSubCategory: (subCategoryId: string, categoryId: string) => void;

    /**
     * Limpia todos los filtros activos y regresa al estado inicial.
     * No afecta `expandedCategoryId` — el sidebar mantiene su estado visual.
     *
     * @example
     * ```tsx
     * <button onClick={clearFilters}>Limpiar filtros</button>
     * ```
     */
    clearFilters: () => void;
}

/** Estado inicial de los filtros — sin ningún filtro activo. */
const INITIAL_FILTERS: CatalogFilters = {
    categoryId: null,
    subCategoryIds: [],
    showAllInCategory: false,
};

/**
 * Store global de filtros del catálogo.
 * No persiste en localStorage — se reinicia en cada sesión.
 */
export const useFilterStore = create<FilterState>()((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,
    expandedCategoryId: null,
    filters: INITIAL_FILTERS,

    loadCategories: async () => {
        if (get().categories.length > 0) return;

        set({ isLoading: true, error: null });

        try {
            const categories = await FilterService.getCategories();
            set({ categories, isLoading: false });
        } catch {
            set({
                error: 'No se pudieron cargar los filtros. Intenta de nuevo.',
                isLoading: false,
            });
        }
    },

    toggleExpanded: (categoryId: string) => {
        const current = get().expandedCategoryId;
        // Si ya está abierta la cierra, si no la abre (y cierra cualquier otra)
        set({ expandedCategoryId: current === categoryId ? null : categoryId });
    },

    selectAllInCategory: (categoryId: string) => {
        const { filters } = get();
        const isAlreadyAll =
            filters.categoryId === categoryId && filters.showAllInCategory;

        if (isAlreadyAll) {
            // Toggle off: deselecciona la categoría completamente
            set({ filters: INITIAL_FILTERS });
        } else {
            // Activa "ver todos" para esta categoría, limpia subcategorías
            set({
                filters: {
                    categoryId,
                    subCategoryIds: [],
                    showAllInCategory: true,
                },
            });
        }
    },

    toggleSubCategory: (subCategoryId: string, categoryId: string) => {
        const { subCategoryIds } = get().filters;

        const isActive = subCategoryIds.includes(subCategoryId);
        const nextIds = isActive
            ? subCategoryIds.filter((id) => id !== subCategoryId)
            : [...subCategoryIds, subCategoryId];

        set({
            filters: {
                // Asegura que la categoría padre esté activa
                categoryId,
                // Al tener subcategorías específicas, showAll es siempre false
                showAllInCategory: false,
                subCategoryIds: nextIds,
            },
        });
    },

    clearFilters: () => {
        set({ filters: INITIAL_FILTERS });
        // No limpiamos expandedCategoryId — el sidebar mantiene su estado visual
    },
}));