/**
 * @file category.service.test.ts
 * @description Tests del servicio CRUD de categorías (admin): rutas, payloads
 * y unwrap del envelope.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { CategoryService } from './category.service';

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

describe('CategoryService', () => {
  it('getAll consume GET /categories y devuelve data', async () => {
    mockedGet.mockResolvedValue(envelope([{ id: 1 }]));
    await expect(CategoryService.getAll()).resolves.toEqual([{ id: 1 }]);
    expect(mockedGet).toHaveBeenCalledWith('/categories');
  });

  it('getById consume GET /categories/:id', async () => {
    mockedGet.mockResolvedValue(envelope({ id: 5 }));
    await CategoryService.getById(5);
    expect(mockedGet).toHaveBeenCalledWith('/categories/5');
  });

  it('create envía el payload por POST', async () => {
    const data = { name: 'Anillos', slug: 'anillos' } as never;
    mockedPost.mockResolvedValue(envelope({ id: 1 }));
    await CategoryService.create(data);
    expect(mockedPost).toHaveBeenCalledWith('/categories', data);
  });

  it('update envía el payload por PUT a la ruta del id', async () => {
    const data = { name: 'Nuevo' } as never;
    mockedPut.mockResolvedValue(envelope({ id: 2 }));
    await CategoryService.update(2, data);
    expect(mockedPut).toHaveBeenCalledWith('/categories/2', data);
  });

  it('delete consume DELETE /categories/:id', async () => {
    mockedDelete.mockResolvedValue({ data: { success: true } });
    await CategoryService.delete(9);
    expect(mockedDelete).toHaveBeenCalledWith('/categories/9');
  });
});
