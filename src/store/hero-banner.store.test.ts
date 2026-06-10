/**
 * @file hero-banner.store.test.ts
 * @description Tests del store del banner hero: hidratación con defaults,
 * resolución de la URL de imagen, manejo especial del 404 y guardado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useHeroBannerStore,
  DEFAULT_BANNER_TEXT,
  DEFAULT_BANNER_SUBTITLE,
} from './hero-banner.store';
import { GeneralService } from '@/features/general/services/general.service';

vi.mock('@/features/general/services/general.service', () => ({
  GeneralService: { getBanner: vi.fn(), updateBanner: vi.fn() },
}));

// SERVER_URL fijo para que resolveImageUrl sea determinista.
vi.mock('@/api/server-url', () => ({ SERVER_URL: 'http://localhost:3000' }));

const mockedService = vi.mocked(GeneralService);

beforeEach(() => {
  vi.clearAllMocks();
  useHeroBannerStore.setState({
    bannerText: DEFAULT_BANNER_TEXT,
    bannerSubtitle: DEFAULT_BANNER_SUBTITLE,
    bannerImageUrl: null,
    isFetching: false,
    hasLoaded: false,
    fetchError: null,
    isSaving: false,
    saveError: null,
  });
});

describe('fetchBanner', () => {
  it('hidrata el banner y resuelve una ruta relativa a URL absoluta', async () => {
    mockedService.getBanner.mockResolvedValue({
      title: 'Colección',
      subtitle: 'Sub',
      imageUrl: '/uploads/banners/x.webp',
    } as never);

    await useHeroBannerStore.getState().fetchBanner();

    const state = useHeroBannerStore.getState();
    expect(state.bannerText).toBe('Colección');
    expect(state.bannerImageUrl).toBe('http://localhost:3000/uploads/banners/x.webp');
    expect(state.hasLoaded).toBe(true);
  });

  it('conserva una URL absoluta de imagen tal cual', async () => {
    mockedService.getBanner.mockResolvedValue({
      title: 'T',
      subtitle: 'S',
      imageUrl: 'http://cdn.example.com/x.webp',
    } as never);

    await useHeroBannerStore.getState().fetchBanner();
    expect(useHeroBannerStore.getState().bannerImageUrl).toBe(
      'http://cdn.example.com/x.webp',
    );
  });

  it('aplica defaults sin error cuando el backend responde 404', async () => {
    mockedService.getBanner.mockRejectedValue({ response: { status: 404 } });

    await useHeroBannerStore.getState().fetchBanner();

    const state = useHeroBannerStore.getState();
    expect(state.bannerText).toBe(DEFAULT_BANNER_TEXT);
    expect(state.bannerImageUrl).toBeNull();
    expect(state.fetchError).toBeNull();
    expect(state.hasLoaded).toBe(true);
  });

  it('expone fetchError ante un error distinto de 404', async () => {
    mockedService.getBanner.mockRejectedValue({ response: { status: 500 } });
    await useHeroBannerStore.getState().fetchBanner();
    expect(useHeroBannerStore.getState().fetchError).toMatch(/No se pudo cargar/);
  });
});

describe('saveBanner', () => {
  it('devuelve true y sincroniza el estado tras guardar', async () => {
    mockedService.updateBanner.mockResolvedValue({
      title: 'Nuevo',
      subtitle: 'Sub',
      imageUrl: null,
    } as never);

    const ok = await useHeroBannerStore.getState().saveBanner({ title: 'Nuevo' });

    expect(ok).toBe(true);
    expect(useHeroBannerStore.getState().bannerText).toBe('Nuevo');
  });

  it('devuelve false y expone saveError si falla', async () => {
    mockedService.updateBanner.mockRejectedValue(new Error('fail'));
    const ok = await useHeroBannerStore.getState().saveBanner({ title: 'X' });
    expect(ok).toBe(false);
    expect(useHeroBannerStore.getState().saveError).toMatch(/No se pudieron guardar/);
  });
});
