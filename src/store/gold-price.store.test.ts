/**
 * @file gold-price.store.test.ts
 * @description Tests del store del precio del oro: carga con deduplicación,
 * guardas de concurrencia, set local y manejo de error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGoldPriceStore } from './gold-price.store';
import { GeneralService } from '@/features/general/services/general.service';

vi.mock('@/features/general/services/general.service', () => ({
  GeneralService: { getGoldPrice: vi.fn() },
}));

const mockedService = vi.mocked(GeneralService);

beforeEach(() => {
  vi.clearAllMocks();
  useGoldPriceStore.setState({
    goldPricePerGram: null,
    lastUpdate: null,
    isLoading: false,
    error: null,
  });
});

describe('loadGoldPrice', () => {
  it('carga el precio y la fecha desde el backend', async () => {
    mockedService.getGoldPrice.mockResolvedValue({
      goldPricePerGram: 350000,
      lastUpdate: '2026-06-08',
    } as never);

    await useGoldPriceStore.getState().loadGoldPrice();

    const state = useGoldPriceStore.getState();
    expect(state.goldPricePerGram).toBe(350000);
    expect(state.lastUpdate).toBe('2026-06-08');
  });

  it('no recarga si ya hay un precio en memoria y no se fuerza', async () => {
    useGoldPriceStore.setState({ goldPricePerGram: 100 });
    await useGoldPriceStore.getState().loadGoldPrice();
    expect(mockedService.getGoldPrice).not.toHaveBeenCalled();
  });

  it('recarga cuando se fuerza aunque haya un precio', async () => {
    useGoldPriceStore.setState({ goldPricePerGram: 100 });
    mockedService.getGoldPrice.mockResolvedValue({
      goldPricePerGram: 200,
      lastUpdate: 'x',
    } as never);

    await useGoldPriceStore.getState().loadGoldPrice(true);
    expect(useGoldPriceStore.getState().goldPricePerGram).toBe(200);
  });

  it('no lanza una segunda petición si ya hay una en curso', async () => {
    useGoldPriceStore.setState({ isLoading: true });
    await useGoldPriceStore.getState().loadGoldPrice(true);
    expect(mockedService.getGoldPrice).not.toHaveBeenCalled();
  });

  it('expone un error legible si la carga falla', async () => {
    mockedService.getGoldPrice.mockRejectedValue(new Error('net'));
    await useGoldPriceStore.getState().loadGoldPrice();
    expect(useGoldPriceStore.getState().error).toMatch(/No se pudo obtener/);
  });
});

describe('setGoldPrice', () => {
  it('actualiza el precio local sin llamar al backend', () => {
    useGoldPriceStore.getState().setGoldPrice(500000, '2026-06-09');
    const state = useGoldPriceStore.getState();
    expect(state.goldPricePerGram).toBe(500000);
    expect(state.lastUpdate).toBe('2026-06-09');
    expect(mockedService.getGoldPrice).not.toHaveBeenCalled();
  });
});
