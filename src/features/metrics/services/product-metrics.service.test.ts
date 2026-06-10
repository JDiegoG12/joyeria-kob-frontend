/**
 * @file product-metrics.service.test.ts
 * @description Tests del servicio de métricas de productos: normalización del
 * resumen por estado, conteo por categoría (filtrado/orden) y top de favoritos.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { ProductMetricsService } from './product-metrics.service';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getStatusSummary', () => {
  it('mapea el resumen y rellena con 0 los estados omitidos por el backend', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: { totalProductos: 10, porEstado: { AVAILABLE: 7 } },
      },
    });

    const summary = await ProductMetricsService.getStatusSummary();

    expect(mockedGet).toHaveBeenCalledWith('/products/stats', {
      params: { agrupar: 'estado' },
    });
    expect(summary).toEqual({
      total: 10,
      available: 7,
      outOfStock: 0,
      hidden: 0,
    });
  });
});

describe('getCategoryCounts', () => {
  it('descarta categorías con count 0 y ordena descendentemente', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: {
          totalProductos: 6,
          porCategoria: { Anillos: 2, Aretes: 0, Collares: 4 },
        },
      },
    });

    const counts = await ProductMetricsService.getCategoryCounts();

    expect(mockedGet).toHaveBeenCalledWith('/products/stats', {
      params: { agrupar: 'categoria' },
    });
    expect(counts).toEqual([
      { category: 'Collares', count: 4 },
      { category: 'Anillos', count: 2 },
    ]);
  });

  it('devuelve [] cuando el backend no trae porCategoria', async () => {
    mockedGet.mockResolvedValue({
      data: { success: true, data: { totalProductos: 0 } },
    });
    await expect(ProductMetricsService.getCategoryCounts()).resolves.toEqual([]);
  });
});

describe('getTopFavorites', () => {
  it('usa el limit por defecto (5) y normaliza cada punto', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [{ productId: 'p1', name: 'Anillo', favoritesCount: 9, extra: 'x' }],
      },
    });

    const top = await ProductMetricsService.getTopFavorites();

    expect(mockedGet).toHaveBeenCalledWith('/products/favorites/top', {
      params: { limit: 5 },
    });
    expect(top).toEqual([
      { productId: 'p1', name: 'Anillo', favoritesCount: 9 },
    ]);
  });

  it('propaga el limit recibido', async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [] } });
    await ProductMetricsService.getTopFavorites(20);
    expect(mockedGet).toHaveBeenCalledWith('/products/favorites/top', {
      params: { limit: 20 },
    });
  });
});
