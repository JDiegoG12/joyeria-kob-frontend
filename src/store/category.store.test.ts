/**
 * @file category.store.test.ts
 * @description Tests del store de categorías: carga con dedup, traducción de
 * códigos de error del backend, navegación del catálogo público (reset de
 * subcategoría) y transiciones del drawer admin.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCategoryStore } from './category.store';
import { CategoryService } from '@/features/categories/services/category.service';
import type { Category } from '@/features/categories/types/category.types';

vi.mock('@/features/categories/services/category.service', () => ({
  CategoryService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const showToast = vi.hoisted(() => vi.fn());
vi.mock('@/store/toast.store', () => ({
  useToastStore: { getState: () => ({ showToast }) },
}));

const mockedService = vi.mocked(CategoryService);
const category = { id: 1, name: 'Anillos' } as Category;

beforeEach(() => {
  vi.clearAllMocks();
  useCategoryStore.setState({
    categories: [],
    isLoading: false,
    error: null,
    selectedCatalogCategoryId: null,
    selectedCatalogSubCategoryId: null,
    selectedCategory: null,
    drawerMode: 'closed',
    isSaving: false,
    isDeleting: false,
    mutationError: null,
  });
});

describe('loadCategories', () => {
  it('carga y evita peticiones duplicadas si ya hay datos', async () => {
    mockedService.getAll.mockResolvedValue([category]);
    await useCategoryStore.getState().loadCategories();
    expect(useCategoryStore.getState().categories).toHaveLength(1);

    await useCategoryStore.getState().loadCategories();
    expect(mockedService.getAll).toHaveBeenCalledOnce();
  });

  it('recarga cuando se fuerza', async () => {
    useCategoryStore.setState({ categories: [category] });
    mockedService.getAll.mockResolvedValue([category]);
    await useCategoryStore.getState().loadCategories(true);
    expect(mockedService.getAll).toHaveBeenCalledOnce();
  });
});

describe('createCategory', () => {
  it('en éxito cierra el drawer y notifica', async () => {
    mockedService.create.mockResolvedValue(category);
    mockedService.getAll.mockResolvedValue([category]);

    await useCategoryStore.getState().createCategory({ name: 'x', slug: 'x' } as never);

    expect(useCategoryStore.getState().drawerMode).toBe('closed');
    expect(showToast).toHaveBeenCalledWith('success', expect.any(String));
  });

  it('traduce el código de error del backend a un mensaje amigable', async () => {
    mockedService.create.mockRejectedValue({
      response: { data: { error: 'SLUG_ALREADY_EXISTS' } },
    });

    await expect(
      useCategoryStore.getState().createCategory({ name: 'x', slug: 'x' } as never),
    ).rejects.toBeDefined();

    expect(useCategoryStore.getState().mutationError).toMatch(/enlace web/i);
    expect(showToast).toHaveBeenCalledWith('error', expect.stringMatching(/enlace web/i));
  });
});

describe('navegación del catálogo público', () => {
  it('selectCatalogCategory resetea la subcategoría activa', () => {
    useCategoryStore.setState({ selectedCatalogSubCategoryId: 3 });

    useCategoryStore.getState().selectCatalogCategory(1);

    const state = useCategoryStore.getState();
    expect(state.selectedCatalogCategoryId).toBe(1);
    expect(state.selectedCatalogSubCategoryId).toBeNull();
  });

  it('selectCatalogSubCategory fija la subcategoría', () => {
    useCategoryStore.getState().selectCatalogSubCategory(3);
    expect(useCategoryStore.getState().selectedCatalogSubCategoryId).toBe(3);
  });
});

describe('drawer admin', () => {
  it('openView abre en modo view con la categoría', () => {
    useCategoryStore.getState().openView(category);
    const state = useCategoryStore.getState();
    expect(state.drawerMode).toBe('view');
    expect(state.selectedCategory).toBe(category);
  });

  it('openCreate abre en modo create sin selección', () => {
    useCategoryStore.getState().openCreate();
    expect(useCategoryStore.getState().drawerMode).toBe('create');
    expect(useCategoryStore.getState().selectedCategory).toBeNull();
  });

  it('closeDrawer cierra y limpia', () => {
    useCategoryStore.getState().openView(category);
    useCategoryStore.getState().closeDrawer();
    const state = useCategoryStore.getState();
    expect(state.drawerMode).toBe('closed');
    expect(state.selectedCategory).toBeNull();
  });
});
