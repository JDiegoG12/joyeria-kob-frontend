/**
 * @file favorite.service.test.ts
 * @description Tests del servicio de favoritos: rutas, payload y fallback a [].
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { favoriteService } from './favorite.service';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedDelete = vi.mocked(apiClient.delete);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('favoriteService', () => {
  it('getAll devuelve [] cuando el backend no trae data', async () => {
    mockedGet.mockResolvedValue({ data: {} });
    await expect(favoriteService.getAll()).resolves.toEqual([]);
    expect(mockedGet).toHaveBeenCalledWith('/favorites');
  });

  it('add envía { productId } y devuelve el registro pelado', async () => {
    mockedPost.mockResolvedValue({
      data: { success: true, data: { id: 5, productId: 'p1' } },
    });

    const record = await favoriteService.add('p1');

    expect(mockedPost).toHaveBeenCalledWith('/favorites', { productId: 'p1' });
    expect(record).toEqual({ id: 5, productId: 'p1' });
  });

  it('remove consume DELETE /favorites/:productId', async () => {
    mockedDelete.mockResolvedValue({ data: { success: true } });
    await favoriteService.remove('p1');
    expect(mockedDelete).toHaveBeenCalledWith('/favorites/p1');
  });
});
