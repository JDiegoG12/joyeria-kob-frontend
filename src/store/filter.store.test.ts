/**
 * @file filter.store.test.ts
 * @description Tests del store de filtros del catálogo: expansión visual (UI)
 * independiente de los filtros de datos, selección de categoría/subcategoría y
 * carga con deduplicación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFilterStore } from './filter.store';
import { FilterService } from '@/features/catalog/services/filter.service';

vi.mock('@/features/catalog/services/filter.service', () => ({
  FilterService: { getCategories: vi.fn() },
}));

const mockedService = vi.mocked(FilterService);

const INITIAL_FILTERS = {
  categoryId: null,
  subCategoryIds: [],
  showAllInCategory: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  useFilterStore.setState({
    categories: [],
    isLoading: false,
    error: null,
    expandedCategoryId: null,
    filters: INITIAL_FILTERS,
  });
});

describe('toggleExpanded (solo UI)', () => {
  it('expande una categoría y colapsa la anterior, sin tocar los filtros', () => {
    useFilterStore.getState().toggleExpanded('anillos');
    expect(useFilterStore.getState().expandedCategoryId).toBe('anillos');

    useFilterStore.getState().toggleExpanded('collares');
    expect(useFilterStore.getState().expandedCategoryId).toBe('collares');
    expect(useFilterStore.getState().filters).toEqual(INITIAL_FILTERS);
  });

  it('colapsa si se vuelve a pulsar la misma categoría', () => {
    useFilterStore.getState().toggleExpanded('anillos');
    useFilterStore.getState().toggleExpanded('anillos');
    expect(useFilterStore.getState().expandedCategoryId).toBeNull();
  });
});

describe('selectAllInCategory', () => {
  it('activa "ver todos" para la categoría y limpia subcategorías', () => {
    useFilterStore.getState().selectAllInCategory('anillos');
    expect(useFilterStore.getState().filters).toEqual({
      categoryId: 'anillos',
      subCategoryIds: [],
      showAllInCategory: true,
    });
  });

  it('al pulsar de nuevo en modo "todos" deselecciona la categoría', () => {
    useFilterStore.getState().selectAllInCategory('anillos');
    useFilterStore.getState().selectAllInCategory('anillos');
    expect(useFilterStore.getState().filters).toEqual(INITIAL_FILTERS);
  });
});

describe('toggleSubCategory', () => {
  it('agrega subcategorías (selección múltiple) y apaga showAllInCategory', () => {
    useFilterStore.getState().toggleSubCategory('compromiso', 'anillos');
    useFilterStore.getState().toggleSubCategory('solitarios', 'anillos');

    expect(useFilterStore.getState().filters).toEqual({
      categoryId: 'anillos',
      subCategoryIds: ['compromiso', 'solitarios'],
      showAllInCategory: false,
    });
  });

  it('quita una subcategoría ya activa (toggle off)', () => {
    useFilterStore.getState().toggleSubCategory('compromiso', 'anillos');
    useFilterStore.getState().toggleSubCategory('compromiso', 'anillos');
    expect(useFilterStore.getState().filters.subCategoryIds).toEqual([]);
  });
});

describe('clearFilters', () => {
  it('resetea los filtros pero conserva la expansión visual del sidebar', () => {
    useFilterStore.getState().toggleExpanded('anillos');
    useFilterStore.getState().selectAllInCategory('anillos');

    useFilterStore.getState().clearFilters();

    expect(useFilterStore.getState().filters).toEqual(INITIAL_FILTERS);
    expect(useFilterStore.getState().expandedCategoryId).toBe('anillos');
  });
});

describe('loadCategories', () => {
  it('carga categorías desde el servicio', async () => {
    mockedService.getCategories.mockResolvedValue([
      { id: '1', label: 'Anillos', subCategories: [] },
    ]);

    await useFilterStore.getState().loadCategories();

    expect(useFilterStore.getState().categories).toHaveLength(1);
    expect(useFilterStore.getState().isLoading).toBe(false);
  });

  it('no recarga si ya hay categorías en memoria', async () => {
    useFilterStore.setState({
      categories: [{ id: '1', label: 'Anillos', subCategories: [] }],
    });

    await useFilterStore.getState().loadCategories();
    expect(mockedService.getCategories).not.toHaveBeenCalled();
  });

  it('expone un error legible si la carga falla', async () => {
    mockedService.getCategories.mockRejectedValue(new Error('net'));
    await useFilterStore.getState().loadCategories();
    expect(useFilterStore.getState().error).toMatch(/No se pudieron cargar/);
  });
});
