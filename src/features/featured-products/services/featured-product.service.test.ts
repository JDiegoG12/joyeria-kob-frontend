/**
 * @file featured-product.service.test.ts
 * @description Tests del servicio de productos destacados: rutas, payloads y
 * fallback a [] cuando el backend no trae data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { FeaturedProductService } from './featured-product.service';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPut = vi.mocked(apiClient.put);
const mockedDelete = vi.mocked(apiClient.delete);
const envelope = (data: unknown) => ({ data: { success: true, data } });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FeaturedProductService', () => {
  it('getAll devuelve [] cuando el backend no trae data', async () => {
    mockedGet.mockResolvedValue({ data: {} });
    await expect(FeaturedProductService.getAll()).resolves.toEqual([]);
    expect(mockedGet).toHaveBeenCalledWith('/featured-products');
  });

  it('add envía { productId } por POST', async () => {
    mockedPost.mockResolvedValue(envelope({ id: 1 }));
    await FeaturedProductService.add('p1');
    expect(mockedPost).toHaveBeenCalledWith('/featured-products', {
      productId: 'p1',
    });
  });

  it('remove consume DELETE con el productId', async () => {
    mockedDelete.mockResolvedValue({ data: { success: true } });
    await FeaturedProductService.remove('p1');
    expect(mockedDelete).toHaveBeenCalledWith('/featured-products/p1');
  });

  it('reorder envía el array de items por PUT y devuelve la lista', async () => {
    const items = [{ productId: 'p1', position: 1 }];
    mockedPut.mockResolvedValue(envelope(items));
    const result = await FeaturedProductService.reorder(items);
    expect(mockedPut).toHaveBeenCalledWith('/featured-products/reorder', items);
    expect(result).toEqual(items);
  });
});
