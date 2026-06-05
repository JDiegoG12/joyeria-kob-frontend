/**
 * @file category.store.ts
 * @description Store Zustand para la gestión de categorías.
 *
 * ## Separación de responsabilidades
 *
 * Este store maneja DOS contextos distintos:
 *
 * ### Contexto Admin (panel de administración)
 * - CRUD de categorías con feedback toast
 * - Estado del Drawer (create / view / edit / closed)
 * - `selectedCategory` para el formulario de edición
 *
 * ### Contexto Catálogo público
 * - `selectedCatalogCategoryId` — categoría raíz activa en la barra de filtros
 * - `selectedCatalogSubCategoryId` — subcategoría activa (drill-down)
 * - `selectCatalogCategory` / `selectCatalogSubCategory` — acciones de navegación
 * - Al cambiar de categoría raíz, la subcategoría se resetea automáticamente
 *
 * ## Flujo del Drawer (admin)
 * ```
 * openCreate()  → drawerMode = 'create', selectedCategory = null
 * openView(cat) → drawerMode = 'view',   selectedCategory = cat
 * openEdit()    → drawerMode = 'edit'    (selectedCategory ya está seteada)
 * closeDrawer() → drawerMode = 'closed', selectedCategory = null
 * ```
 *
 * ## Flujo del catálogo público
 * ```
 * selectCatalogCategory(1)    → muestra todos los anillos (raíz)
 * selectCatalogSubCategory(3) → filtra por la subcategoría "Compromiso"
 * selectCatalogCategory(null) → limpia todos los filtros de categoría
 * ```
 *
 * @example
 * ```ts
 * // En el catálogo público
 * const { categories, selectedCatalogCategoryId, selectCatalogCategory } = useCategoryStore();
 *
 * // En el panel admin
 * const { drawerMode, selectedCategory, openView, openCreate } = useCategoryStore();
 * ```
 */

import { create } from 'zustand';
import { CategoryService } from '@/features/categories/services/category.service';
import { useToastStore } from '@/store/toast.store';
import type {
  Category,
  CategoryCreateInput,
  CategoryErrorCode,
  CategoryUpdateInput,
  DrawerMode,
} from '@/features/categories/types/category.types';

// ─── Forma del estado ─────────────────────────────────────────────────────────

interface CategoryState {
  // ── Datos compartidos ───────────────────────────────────────────────────────

  /** Lista de todas las categorías (raíz + anidadas en `children`). */
  categories: Category[];
  /** `true` mientras se carga el listado inicial. */
  isLoading: boolean;
  /** Mensaje de error de carga, o `null` si no hay error. */
  error: string | null;

  // ── Estado del catálogo público ─────────────────────────────────────────────

  /**
   * ID de la categoría raíz actualmente seleccionada en el catálogo público.
   * `null` significa "mostrar todo" (sin filtro de categoría activo).
   */
  selectedCatalogCategoryId: number | null;

  /**
   * ID de la subcategoría actualmente seleccionada en el catálogo público.
   * `null` si no hay subcategoría activa (se muestra toda la categoría raíz).
   * Se resetea automáticamente al cambiar `selectedCatalogCategoryId`.
   */
  selectedCatalogSubCategoryId: number | null;

  // ── Estado del Drawer (admin) ───────────────────────────────────────────────

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
   * @param force - Si `true`, recarga aunque ya haya datos en el store.
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

  // ── Acciones del catálogo público ───────────────────────────────────────────

  /**
   * Selecciona una categoría raíz para el filtro del catálogo público.
   * Resetea automáticamente `selectedCatalogSubCategoryId` a `null`.
   *
   * @param categoryId - ID de la categoría raíz, o `null` para mostrar todo.
   *
   * @example
   * ```tsx
   * <button onClick={() => selectCatalogCategory(1)}>Anillos</button>
   * <button onClick={() => selectCatalogCategory(null)}>Todo</button>
   * ```
   */
  selectCatalogCategory: (categoryId: number | null) => void;

  /**
   * Selecciona o deselecciona una subcategoría dentro de la categoría activa.
   * Si la subcategoría ya estaba seleccionada, la deselecciona (toggle).
   *
   * @param subCategoryId - ID de la subcategoría, o `null` para limpiar.
   *
   * @example
   * ```tsx
   * <button onClick={() => selectCatalogSubCategory(category.id === selectedId ? null : category.id)}>
   *   {category.name}
   * </button>
   * ```
   */
  selectCatalogSubCategory: (subCategoryId: number | null) => void;

  // ── Acciones de UI del Drawer (admin) ──────────────────────────────────────

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
 * Traduce los códigos de error del backend a mensajes cortos y amigables
 * para notificaciones tipo toast.
 */
const ERROR_MESSAGES: Record<CategoryErrorCode, string> = {
  CATEGORY_NOT_FOUND: 'Esta categoría ya no existe o fue eliminada.',
  CATEGORY_HAS_CHILDREN:
    'Contiene subcategorías. Muévelas o elimínalas primero.',
  CATEGORY_HAS_PRODUCTS:
    'No se puede eliminar porque aún contiene joyas asignadas.',
  SLUG_ALREADY_EXISTS:
    'El enlace web para este nombre ya existe. Usa uno distinto.',
  MISSING_FIELDS: 'El nombre es obligatorio.',
  INVALID_PARENT_ID: 'La categoría superior seleccionada no es válida.',
  NAME_ALREADY_EXISTS: 'Ya existe una categoría con este nombre en este grupo.',
  CYCLIC_REFERENCE:
    'No puedes guardar una categoría dentro de sus propias subcategorías.',
  INVALID_ID: 'Error al procesar la categoría. Recarga la página.',
  INTERNAL_ERROR: 'Ocurrió un error en el sistema. Intenta de nuevo más tarde.',
};

/**
 * Extrae el mensaje de error legible de una excepción de Axios o genérica.
 */
const resolveErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
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
  // ── Estado inicial ──────────────────────────────────────────────────────────
  categories: [],
  isLoading: false,
  error: null,

  // Catálogo público
  selectedCatalogCategoryId: null,
  selectedCatalogSubCategoryId: null,

  // Admin drawer
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
      useToastStore
        .getState()
        .showToast('error', 'Error al cargar el listado de categorías.');
    }
  },

  // ── createCategory ──────────────────────────────────────────────────────────
  createCategory: async (data) => {
    set({ isSaving: true, mutationError: null });
    try {
      await CategoryService.create(data);
      await get().loadCategories(true);
      set({ isSaving: false, drawerMode: 'closed', selectedCategory: null });
      useToastStore
        .getState()
        .showToast('success', 'Categoría creada exitosamente.');
    } catch (error) {
      const msg = resolveErrorMessage(error);
      set({ isSaving: false, mutationError: msg });
      useToastStore.getState().showToast('error', msg);
      throw error;
    }
  },

  // ── updateCategory ──────────────────────────────────────────────────────────
  updateCategory: async (id, data) => {
    set({ isSaving: true, mutationError: null });
    try {
      const updated = await CategoryService.update(id, data);
      await get().loadCategories(true);
      set({ isSaving: false, drawerMode: 'view', selectedCategory: updated });
      useToastStore
        .getState()
        .showToast('success', 'Categoría actualizada correctamente.');
    } catch (error) {
      const msg = resolveErrorMessage(error);
      set({ isSaving: false, mutationError: msg });
      useToastStore.getState().showToast('error', msg);
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
      useToastStore
        .getState()
        .showToast('success', 'Categoría eliminada correctamente.');
    } catch (error) {
      const msg = resolveErrorMessage(error);
      set({ isDeleting: false, mutationError: msg });
      useToastStore.getState().showToast('error', msg);
      throw error;
    }
  },

  // ── Acciones del catálogo público ───────────────────────────────────────────
  selectCatalogCategory: (categoryId) => {
    set({
      selectedCatalogCategoryId: categoryId,
      // Siempre resetear subcategoría al cambiar la categoría raíz
      selectedCatalogSubCategoryId: null,
    });
  },

  selectCatalogSubCategory: (subCategoryId) => {
    set({ selectedCatalogSubCategoryId: subCategoryId });
  },

  // ── Acciones de UI del Drawer (admin) ──────────────────────────────────────
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