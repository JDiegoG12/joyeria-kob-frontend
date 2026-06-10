/**
 * @file filter.service.test.ts
 * @description Tests del servicio que transforma el árbol de categorías del
 * backend al formato que espera el sidebar de filtros del catálogo público.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { FilterService } from './filter.service';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

/** Construye una BackendCategory mínima para los tests. */
const cat = (
  id: number,
  name: string,
  parentId: number | null,
  children: Array<{ id: number; name: string }> = [],
) => ({
  id,
  name,
  slug: name.toLowerCase(),
  parentId,
  children: children.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.name.toLowerCase(),
    parentId: id,
    children: [],
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FilterService.getCategories', () => {
  it('consume GET /categories', async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [] } });
    await FilterService.getCategories();
    expect(mockedGet).toHaveBeenCalledWith('/categories');
  });

  it('expone solo categorías raíz (parentId === null)', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          cat(1, 'Anillos', null),
          cat(2, 'Solitarios', 1),
        ],
      },
    });

    const result = await FilterService.getCategories();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('mapea el modelo backend al modelo de UI (id a string, name → label, children → subCategories)', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          cat(3, 'Aretes', null, [{ id: 30, name: 'Topos' }]),
        ],
      },
    });

    const [category] = await FilterService.getCategories();
    expect(category).toEqual({
      id: '3',
      label: 'Aretes',
      subCategories: [{ id: '30', label: 'Topos' }],
    });
  });

  it('ordena raíces y subcategorías alfabéticamente (es, insensible a acentos)', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          cat(1, 'Collares', null, [
            { id: 11, name: 'Zafiro' },
            { id: 12, name: 'Ámbar' },
          ]),
          cat(2, 'Anillos', null),
        ],
      },
    });

    const result = await FilterService.getCategories();
    expect(result.map((c) => c.label)).toEqual(['Anillos', 'Collares']);
    expect(result[1].subCategories.map((s) => s.label)).toEqual([
      'Ámbar',
      'Zafiro',
    ]);
  });
});
