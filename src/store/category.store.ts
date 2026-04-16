/**
 * @file category.store.ts
 * @description Store Zustand para la gestión de categorías del panel admin.
 *
 * Responsabilidades
 * - Mantener la lista de categorías cargadas desde el backend.
 * - Controlar el estado del Drawer (modo y categoría seleccionada).
 * - Ejecutar operaciones CRUD actualizando el estado local tras confirmación.
 * - Disparar notificaciones toast para dar feedback visual al usuario.
 *
 * Flujo del Drawer
 * openCreate()  → drawerMode = 'create', selectedCategory = null
 * openView(cat) → drawerMode = 'view',   selectedCategory = cat
 * openEdit()    → drawerMode = 'edit'    (selectedCategory ya está seteada)
 * closeDrawer() → drawerMode = 'closed', selectedCategory = null
 *
 * Uso en componentes
 * ```ts
 * import { useCategoryStore } from '@/store/category.store';
 * const { categories, drawerMode, selectedCategory, openView } = useCategoryStore();
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
  /** Categoría raíz seleccionada en el catálogo público. */
  selectedCatalogCategoryId: number | null;
  /** Subcategoría seleccionada en el catálogo público. */
  selectedCatalogSubCategoryId: number | null;

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
  /** Selecciona una categoría raíz para el drill-down público. */
  selectCatalogCategory: (categoryId: number | null) => void;
  /** Selecciona una subcategoría dentro de la categoría activa. */
  selectCatalogSubCategory: (subCategoryId: number | null) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Traduce los códigos de error del backend a mensajes cortos y amigables
 * para notificaciones tipo toast.
 */
const ERROR_MESSAGES: Record<CategoryErrorCode, string> = {
  CATEGORY_NOT_FOUND: 'Esta categoría ya no existe o fue eliminada.',
  CATEGORY_HAS_CHILDREN:
    'Contiene subcategorías. Múevelas o elimínalas primero.',
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
 * Extrae el mensaje de error de una excepción de Axios o genérica.
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
  // Estado inicial
  categories: [],
  isLoading: false,
  error: null,
  selectedCategory: null,
  drawerMode: 'closed',
  isSaving: false,
  isDeleting: false,
  mutationError: null,
  selectedCatalogCategoryId: null,
  selectedCatalogSubCategoryId: null,

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

  // ── Acciones de UI ──────────────────────────────────────────────────────────
  openView: (category) => {
    set({
      selectedCategory: category,
      drawerMode: 'view',
      mutationError: null,
    });
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

  selectCatalogCategory: (categoryId) => {
    set({
      selectedCatalogCategoryId: categoryId,
      selectedCatalogSubCategoryId: null,
    });
  },

  selectCatalogSubCategory: (subCategoryId) => {
    set({ selectedCatalogSubCategoryId: subCategoryId });
  },
}));
