/**
 * @file featured-product.store.test.ts
 * @description Tests del store de productos destacados: orden defensivo por
 * position, refresco tras mutación, y el reorder optimista con revert.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFeaturedProductStore } from './featured-product.store';
import { FeaturedProductService } from '@/features/featured-products/services/featured-product.service';
import type { FeaturedProductWithProduct } from '@/features/featured-products/types/featured-product.types';

vi.mock('@/features/featured-products/services/featured-product.service', () => ({
  FeaturedProductService: {
    getAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
  },
}));

const mockedService = vi.mocked(FeaturedProductService);

/** Crea un destacado mínimo con productId y position. */
const feat = (productId: string, position: number): FeaturedProductWithProduct =>
  ({ productId, position, product: { id: productId } }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  useFeaturedProductStore.setState({
    items: [],
    isFetching: false,
    fetchError: null,
    isSaving: false,
    saveError: null,
  });
});

describe('fetchFeatured', () => {
  it('ordena defensivamente por position ascendente', async () => {
    mockedService.getAll.mockResolvedValue([feat('c', 3), feat('a', 1), feat('b', 2)]);

    await useFeaturedProductStore.getState().fetchFeatured();

    const ids = useFeaturedProductStore.getState().items.map((i) => i.productId);
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('expone fetchError con el mensaje del backend si falla', async () => {
    mockedService.getAll.mockRejectedValue({
      response: { data: { message: 'backend dijo no' } },
    });

    await useFeaturedProductStore.getState().fetchFeatured();
    expect(useFeaturedProductStore.getState().fetchError).toBe('backend dijo no');
  });
});

describe('addFeatured', () => {
  it('agrega y refresca la lista completa', async () => {
    mockedService.add.mockResolvedValue(feat('p2', 2));
    mockedService.getAll.mockResolvedValue([feat('p1', 1), feat('p2', 2)]);

    const ok = await useFeaturedProductStore.getState().addFeatured('p2');

    expect(ok).toBe(true);
    expect(useFeaturedProductStore.getState().items).toHaveLength(2);
    expect(mockedService.getAll).toHaveBeenCalledOnce();
  });

  it('devuelve false y expone saveError si falla', async () => {
    mockedService.add.mockRejectedValue({ response: { data: {} } });
    const ok = await useFeaturedProductStore.getState().addFeatured('p2');
    expect(ok).toBe(false);
    expect(useFeaturedProductStore.getState().saveError).toMatch(/No se pudo agregar/);
  });
});

describe('reorderFeatured (optimista)', () => {
  it('aplica el nuevo orden con posiciones 1..N y confirma con el servidor', async () => {
    const reordered = [feat('b', 0), feat('a', 0)];
    mockedService.reorder.mockResolvedValue([feat('b', 1), feat('a', 2)]);

    const ok = await useFeaturedProductStore.getState().reorderFeatured(reordered);

    expect(ok).toBe(true);
    // Se envía el payload completo con posiciones contiguas 1..N.
    expect(mockedService.reorder).toHaveBeenCalledWith([
      { productId: 'b', position: 1 },
      { productId: 'a', position: 2 },
    ]);
    expect(
      useFeaturedProductStore.getState().items.map((i) => i.productId),
    ).toEqual(['b', 'a']);
  });

  it('revierte al estado previo si el backend falla', async () => {
    const previous = [feat('a', 1), feat('b', 2)];
    useFeaturedProductStore.setState({ items: previous });
    mockedService.reorder.mockRejectedValue(new Error('fail'));

    const ok = await useFeaturedProductStore
      .getState()
      .reorderFeatured([feat('b', 0), feat('a', 0)]);

    expect(ok).toBe(false);
    expect(useFeaturedProductStore.getState().items).toBe(previous);
    expect(useFeaturedProductStore.getState().saveError).toMatch(/No se pudo reordenar/);
  });
});
