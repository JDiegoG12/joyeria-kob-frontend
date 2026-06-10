/**
 * @file use-category-selector.test.ts
 * @description Tests del hook del selector de categorías en dos pasos y del
 * helper puro `resolveCategorySelection`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useCategorySelector,
  resolveCategorySelection,
} from './use-category-selector';
import { CategoryService } from '@/features/categories/services/category.service';
import type { Category } from '@/features/categories/types/category.types';

vi.mock('@/features/categories/services/category.service', () => ({
  CategoryService: { getAll: vi.fn() },
}));

const mockedService = vi.mocked(CategoryService);

/** Árbol de categorías: 2 raíces; "Anillos" con 2 subcategorías. */
const tree = [
  {
    id: 1,
    name: 'Anillos',
    parentId: null,
    children: [
      { id: 10, name: 'Compromiso', parentId: 1, children: [] },
      { id: 11, name: 'Solitarios', parentId: 1, children: [] },
    ],
  },
  { id: 2, name: 'Aretes', parentId: null, children: [] },
] as unknown as Category[];

beforeEach(() => {
  vi.clearAllMocks();
  mockedService.getAll.mockResolvedValue(tree);
});

describe('resolveCategorySelection (puro)', () => {
  it('para una categoría raíz: parent = id, sub = null', () => {
    expect(resolveCategorySelection({ id: 1, parentId: null })).toEqual({
      selectedParentId: 1,
      selectedSubId: null,
    });
  });

  it('para una subcategoría: parent = parentId, sub = id', () => {
    expect(resolveCategorySelection({ id: 10, parentId: 1 })).toEqual({
      selectedParentId: 1,
      selectedSubId: 10,
    });
  });
});

describe('useCategorySelector', () => {
  it('carga solo las categorías raíz al montar', async () => {
    const { result } = renderHook(() => useCategorySelector());

    await waitFor(() =>
      expect(result.current.isLoadingCategories).toBe(false),
    );
    expect(result.current.categories).toEqual([
      { id: 1, name: 'Anillos' },
      { id: 2, name: 'Aretes' },
    ]);
  });

  it('deriva las subcategorías de la categoría principal seleccionada', async () => {
    const { result } = renderHook(() => useCategorySelector());
    await waitFor(() => expect(result.current.categories).toHaveLength(2));

    act(() => result.current.selectParent(1));

    expect(result.current.subCategories).toEqual([
      { id: 10, name: 'Compromiso' },
      { id: 11, name: 'Solitarios' },
    ]);
  });

  it('selectParent limpia la subcategoría previamente elegida', async () => {
    const { result } = renderHook(() => useCategorySelector());
    await waitFor(() => expect(result.current.categories).toHaveLength(2));

    act(() => result.current.selectParent(1));
    act(() => result.current.selectSub(10));
    expect(result.current.selectedSubId).toBe(10);

    act(() => result.current.selectParent(2));
    expect(result.current.selectedSubId).toBeNull();
  });

  it('resolvedCategoryId prioriza la subcategoría sobre la principal', async () => {
    const { result } = renderHook(() => useCategorySelector());
    await waitFor(() => expect(result.current.categories).toHaveLength(2));

    act(() => result.current.selectParent(1));
    expect(result.current.resolvedCategoryId).toBe(1);

    act(() => result.current.selectSub(10));
    expect(result.current.resolvedCategoryId).toBe(10);
  });

  it('initializeWith fija parent y sub; reset los limpia', async () => {
    const { result } = renderHook(() => useCategorySelector());
    await waitFor(() => expect(result.current.categories).toHaveLength(2));

    act(() => result.current.initializeWith(1, 11));
    expect(result.current.resolvedCategoryId).toBe(11);

    act(() => result.current.reset());
    expect(result.current.resolvedCategoryId).toBeNull();
  });

  it('expone un error legible si la carga falla', async () => {
    mockedService.getAll.mockRejectedValue(new Error('net'));
    const { result } = renderHook(() => useCategorySelector());

    await waitFor(() =>
      expect(result.current.categoriesError).toMatch(/No se pudieron cargar/),
    );
  });
});
