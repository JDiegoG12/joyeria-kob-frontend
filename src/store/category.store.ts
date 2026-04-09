/**
 * @file category.store.ts
 * @description Store Zustand para la gestión de categorías del panel admin.
 *
 * ## Responsabilidades
 * - Mantener la lista de categorías cargadas desde el backend.
 * - Controlar el estado del Drawer (modo y categoría seleccionada).
 * - Ejecutar las operaciones CRUD actualizando el estado local
 *   optimistamente o tras confirmación del backend.
 *
 * ## Flujo del Drawer
 * ```
 * openCreate()  → drawerMode = 'create', selectedCategory = null
 * openView(cat) → drawerMode = 'view',   selectedCategory = cat
 * openEdit()    → drawerMode = 'edit'    (selectedCategory ya está seteada)
 * closeDrawer() → drawerMode = 'closed', selectedCategory = null
 * ```
 *
 * ## Uso en componentes
 * ```tsx
 * import { useCategoryStore } from '@/store/category.store';
 *
 * const { categories, drawerMode, selectedCategory, openView } = useCategoryStore();
 * ```
 */

import { create } from 'zustand';
import { CategoryService } from '@/features/categories/services/category.service';
import type {
    Category,
    CategoryCreateInput,
    CategoryErrorCode,
    CategoryUpdateInput,
    DrawerMode,
} from '@/features/categories/types/category.types';

// ─── Forma del estado ─────────────────────────────────────────────────────────

interface CategoryState {
    // ── Datos ──────────────────────────────────────────────────────────────────
    /** Lista de todas las categorías (raíz + anidadas en `children`). */
    categories: Category[];
    /** `true` mientras se carga el listado inicial. */
    isLoading: boolean;
    /** Mensaje de error de carga, o `null` si no hay error. */
    error: string | null;

    // ── Estado del Drawer ───────────────────────────────────────────────────────
    /** Categoría actualmente abierta en el Drawer. `null` si está cerrado o en modo create. */
    selectedCategory: Category | null;
    /** Modo actual del Drawer. */
    drawerMode: DrawerMode;
    /** `true` mientras se ejecuta una operación de guardado (create/update). */
    isSaving: boolean;
    /** `true` mientras se ejecuta una operación de eliminación. */
    isDeleting: boolean;
    /** Error de mutación para mostrar en el formulario/drawer. */
    mutationError: string | null;

    // ── Acciones de datos ───────────────────────────────────────────────────────
    /**
     * Carga todas las categorías desde el backend.
     * Evita peticiones duplicadas si ya hay datos cargados.
     *
     * @param force - Si `true`, recarga aunque ya haya datos.
     */
    loadCategories: (force?: boolean) => Promise<void>;

    /**
     * Crea una nueva categoría y actualiza la lista local.
     *
     * @param data - Datos de la nueva categoría.
     * @throws Propaga el error del backend para que el formulario lo maneje.
     */
    createCategory: (data: CategoryCreateInput) => Promise<void>;

    /**
     * Actualiza una categoría existente y refresca la lista.
     *
     * @param id   - ID de la categoría.
     * @param data - Campos a actualizar.
     */
    updateCategory: (id: number, data: CategoryUpdateInput) => Promise<void>;

    /**
     * Elimina una categoría y la remueve de la lista local.
     * Cierra el Drawer si la categoría eliminada era la seleccionada.
     *
     * @param id - ID de la categoría a eliminar.
     */
    deleteCategory: (id: number) => Promise<void>;

    // ── Acciones de UI ──────────────────────────────────────────────────────────
    /** Abre el Drawer en modo detalle con la categoría recibida. */
    openView: (category: Category) => void;
    /** Abre el Drawer en modo creación (formulario vacío). */
    openCreate: () => void;
    /** Cambia el modo del Drawer de 'view' a 'edit' (selectedCategory ya está seteada). */
    openEdit: () => void;
    /** Cierra el Drawer y limpia la selección. */
    closeDrawer: () => void;
    /** Limpia el error de mutación. */
    clearMutationError: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Traduce los códigos de error del backend a mensajes legibles en español.
 */
const ERROR_MESSAGES: Record<CategoryErrorCode, string> = {
    CATEGORY_NOT_FOUND: 'La categoría no existe en el catálogo.',
    CATEGORY_HAS_CHILDREN:
        'No se puede eliminar porque tiene subcategorías asociadas. Elimínalas primero.',
    CATEGORY_HAS_PRODUCTS:
        'No se puede eliminar porque tiene productos asociados.',
    SLUG_ALREADY_EXISTS:
        'El slug ingresado ya está en uso. Por favor elige otro.',
    MISSING_FIELDS: 'El nombre y el slug son obligatorios.',
    INVALID_PARENT_ID: 'La categoría padre seleccionada no es válida.',
};

/**
 * Extrae el mensaje de error de una excepción de Axios o genérica.
 */
const resolveErrorMessage = (error: unknown): string => {
    if (
        error &&
        typeof error === 'object' &&
        'response' in error
    ) {
        const axiosError = error as {
            response?: { data?: { error?: CategoryErrorCode } };
        };
        const code = axiosError.response?.data?.error;
        if (code && code in ERROR_MESSAGES) {
            return ERROR_MESSAGES[code];
        }
    }
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCategoryStore = create<CategoryState>()((set, get) => ({
    // Estado inicial
    categories: [],
    isLoading: false,
    error: null,
    selectedCategory: null,
    drawerMode: 'closed',
    isSaving: false,
    isDeleting: false,
    mutationError: null,

    // ── loadCategories ──────────────────────────────────────────────────────────
    loadCategories: async (force = false) => {
        if (!force && get().categories.length > 0) return;

        set({ isLoading: true, error: null });
        try {
            const categories = await CategoryService.getAll();
            set({ categories, isLoading: false });
        } catch {
            set({
                error: 'No se pudieron cargar las categorías. Intenta de nuevo.',
                isLoading: false,
            });
        }
    },

    // ── createCategory ──────────────────────────────────────────────────────────
    createCategory: async (data) => {
        set({ isSaving: true, mutationError: null });
        try {
            await CategoryService.create(data);
            // Recarga completa para reflejar la nueva categoría con su árbol actualizado
            await get().loadCategories(true);
            set({ isSaving: false, drawerMode: 'closed', selectedCategory: null });
        } catch (error) {
            set({ isSaving: false, mutationError: resolveErrorMessage(error) });
            throw error;
        }
    },

    // ── updateCategory ──────────────────────────────────────────────────────────
    updateCategory: async (id, data) => {
        set({ isSaving: true, mutationError: null });
        try {
            const updated = await CategoryService.update(id, data);
            await get().loadCategories(true);
            // Actualiza la categoría seleccionada en el drawer con los nuevos datos
            set({ isSaving: false, drawerMode: 'view', selectedCategory: updated });
        } catch (error) {
            set({ isSaving: false, mutationError: resolveErrorMessage(error) });
            throw error;
        }
    },

    // ── deleteCategory ──────────────────────────────────────────────────────────
    deleteCategory: async (id) => {
        set({ isDeleting: true, mutationError: null });
        try {
            await CategoryService.delete(id);
            await get().loadCategories(true);
            set({ isDeleting: false, drawerMode: 'closed', selectedCategory: null });
        } catch (error) {
            set({ isDeleting: false, mutationError: resolveErrorMessage(error) });
            throw error;
        }
    },

    // ── Acciones de UI ──────────────────────────────────────────────────────────
    openView: (category) => {
        set({ selectedCategory: category, drawerMode: 'view', mutationError: null });
    },

    openCreate: () => {
        set({ selectedCategory: null, drawerMode: 'create', mutationError: null });
    },

    openEdit: () => {
        set({ drawerMode: 'edit', mutationError: null });
    },

    closeDrawer: () => {
        set({ drawerMode: 'closed', selectedCategory: null, mutationError: null });
    },

    clearMutationError: () => {
        set({ mutationError: null });
    },
}));