/**
 * @file promo-banner.store.test.ts
 * @description Tests del store de banners de promoción: carga, inserción y
 * actualización manteniendo el orden por posición, y refetch tras eliminar.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePromoBannerStore } from './promo-banner.store';
import { promoBannerService } from '@/features/promotions/services/promo-banner.service';
import type { PromoBanner } from '@/features/promotions/types/promotion.types';

vi.mock('@/features/promotions/services/promo-banner.service', () => ({
  promoBannerService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
  },
}));

const mockedService = vi.mocked(promoBannerService);

/** Crea un banner mínimo con id y position. */
const banner = (id: number, position: number): PromoBanner =>
  ({ id, position }) as PromoBanner;

beforeEach(() => {
  vi.clearAllMocks();
  usePromoBannerStore.setState({
    banners: [],
    isFetching: false,
    fetchError: null,
    isSaving: false,
    saveError: null,
  });
});

describe('fetchBanners', () => {
  it('carga la lista desde el backend', async () => {
    mockedService.getAll.mockResolvedValue([banner(1, 1)]);
    await usePromoBannerStore.getState().fetchBanners();
    expect(usePromoBannerStore.getState().banners).toHaveLength(1);
  });

  it('expone fetchError si falla', async () => {
    mockedService.getAll.mockRejectedValue(new Error('net'));
    await usePromoBannerStore.getState().fetchBanners();
    expect(usePromoBannerStore.getState().fetchError).toMatch(/No se pudieron cargar/);
  });
});

describe('createBanner', () => {
  it('inserta el banner creado y mantiene el orden por posición', async () => {
    usePromoBannerStore.setState({ banners: [banner(1, 1), banner(3, 3)] });
    mockedService.create.mockResolvedValue(banner(2, 2));

    const ok = await usePromoBannerStore.getState().createBanner({} as never);

    expect(ok).toBe(true);
    expect(
      usePromoBannerStore.getState().banners.map((b) => b.position),
    ).toEqual([1, 2, 3]);
  });
});

describe('updateBanner', () => {
  it('reemplaza el banner por id y reordena', async () => {
    usePromoBannerStore.setState({ banners: [banner(1, 1), banner(2, 2)] });
    mockedService.update.mockResolvedValue(banner(1, 3));

    const ok = await usePromoBannerStore.getState().updateBanner(1, {} as never);

    expect(ok).toBe(true);
    expect(
      usePromoBannerStore.getState().banners.map((b) => b.id),
    ).toEqual([2, 1]);
  });
});

describe('deleteBanner', () => {
  it('refetcha para reflejar el recompactado de posiciones', async () => {
    mockedService.remove.mockResolvedValue(undefined);
    mockedService.getAll.mockResolvedValue([banner(1, 1)]);

    const ok = await usePromoBannerStore.getState().deleteBanner(2);

    expect(ok).toBe(true);
    expect(mockedService.getAll).toHaveBeenCalledOnce();
    expect(usePromoBannerStore.getState().banners).toHaveLength(1);
  });
});

describe('reorderBanners', () => {
  it('aplica el orden devuelto por el backend', async () => {
    mockedService.reorder.mockResolvedValue([banner(2, 1), banner(1, 2)]);
    const ok = await usePromoBannerStore.getState().reorderBanners([] as never);
    expect(ok).toBe(true);
    expect(usePromoBannerStore.getState().banners.map((b) => b.id)).toEqual([2, 1]);
  });

  it('devuelve false y expone saveError si falla', async () => {
    mockedService.reorder.mockRejectedValue(new Error('fail'));
    const ok = await usePromoBannerStore.getState().reorderBanners([] as never);
    expect(ok).toBe(false);
    expect(usePromoBannerStore.getState().saveError).toMatch(/No se pudo reordenar/);
  });
});
