/**
 * @file metrics.service.test.ts
 * @description Tests del servicio de métricas: normalización del contrato del
 * backend, orden cronológico y filtrado del histórico por rango.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { MetricsService, getGoldPriceHistory } from './metrics.service';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

/** Punto del backend (con goldPricePerGram) a partir de una fecha y precio. */
const apiPoint = (date: string, goldPricePerGram: number, id = 1) => ({
  id,
  date,
  goldPricePerGram,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Fecha fija para que el filtro por rango sea determinista.
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T00:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('MetricsService.getGoldPriceHistory', () => {
  it('consume el endpoint del histórico y mapea goldPricePerGram → price', async () => {
    mockedGet.mockResolvedValue({
      data: { success: true, data: [apiPoint('2026-06-10', 350000)] },
    });

    const result = await MetricsService.getGoldPriceHistory('1M');

    expect(mockedGet).toHaveBeenCalledWith('/system/gold-price/history');
    expect(result).toEqual([{ date: '2026-06-10', price: 350000 }]);
  });

  it('ordena los puntos cronológicamente (ascendente)', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          apiPoint('2026-06-12', 3, 3),
          apiPoint('2026-06-01', 1, 1),
          apiPoint('2026-06-08', 2, 2),
        ],
      },
    });

    const result = await MetricsService.getGoldPriceHistory('1M');
    expect(result.map((p) => p.price)).toEqual([1, 2, 3]);
  });

  it('filtra fuera los puntos anteriores al inicio del rango', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          apiPoint('2026-01-10', 100), // fuera del rango 1M
          apiPoint('2026-06-10', 350000), // dentro del rango 1M
        ],
      },
    });

    const result = await MetricsService.getGoldPriceHistory('1M');
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(350000);
  });

  it('un rango mayor (1A) incluye puntos de varios meses atrás', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          apiPoint('2025-08-01', 100),
          apiPoint('2026-06-10', 200),
        ],
      },
    });

    const result = await MetricsService.getGoldPriceHistory('1A');
    expect(result).toHaveLength(2);
  });

  it('el export por caso de uso delega en el servicio', async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [] } });
    await expect(getGoldPriceHistory('6M')).resolves.toEqual([]);
  });
});
