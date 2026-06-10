/**
 * @file promo-banner.service.test.ts
 * @description Tests del servicio de banners de promoción: construcción del
 * FormData y la lógica de campos de enlace según el linkType.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { promoBannerService } from './promo-banner.service';
import type { CreatePromoBannerPayload } from '../types/promotion.types';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockedPost = vi.mocked(apiClient.post);
const mockedPut = vi.mocked(apiClient.put);
const envelope = (data: unknown) => ({ data: { success: true, data } });
const file = new File(['x'], 'banner.png', { type: 'image/png' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('create', () => {
  const base: CreatePromoBannerPayload = {
    imageFile: file,
    title: 'Promo',
    subtitle: 'Sub',
    linkType: 'NONE',
  };

  it('adjunta imagen y textos, y para linkType NONE no agrega ids de destino', async () => {
    mockedPost.mockResolvedValue(envelope({ id: 1 }));
    await promoBannerService.create(base);

    const fd = mockedPost.mock.calls[0][1] as FormData;
    expect(fd.get('image')).toBe(file);
    expect(fd.get('title')).toBe('Promo');
    expect(fd.get('linkType')).toBe('NONE');
    expect(fd.has('linkProductId')).toBe(false);
    expect(fd.has('linkCategoryId')).toBe(false);
  });

  it('para linkType PRODUCT adjunta linkProductId', async () => {
    mockedPost.mockResolvedValue(envelope({ id: 1 }));
    await promoBannerService.create({
      ...base,
      linkType: 'PRODUCT',
      linkProductId: 'prod-1',
    });

    const fd = mockedPost.mock.calls[0][1] as FormData;
    expect(fd.get('linkType')).toBe('PRODUCT');
    expect(fd.get('linkProductId')).toBe('prod-1');
    expect(fd.has('linkCategoryId')).toBe(false);
  });

  it('para linkType CATEGORY adjunta linkCategoryId como string', async () => {
    mockedPost.mockResolvedValue(envelope({ id: 1 }));
    await promoBannerService.create({
      ...base,
      linkType: 'CATEGORY',
      linkCategoryId: 42,
    });

    const fd = mockedPost.mock.calls[0][1] as FormData;
    expect(fd.get('linkType')).toBe('CATEGORY');
    expect(fd.get('linkCategoryId')).toBe('42');
    expect(fd.has('linkProductId')).toBe(false);
  });
});

describe('update', () => {
  it('solo adjunta imagen si se provee y omite linkType cuando no cambia', async () => {
    mockedPut.mockResolvedValue(envelope({ id: 1 }));
    await promoBannerService.update(1, { title: 'Nuevo' });

    const [url, body] = mockedPut.mock.calls[0];
    expect(url).toBe('/promo-banners/1');
    const fd = body as FormData;
    expect(fd.get('title')).toBe('Nuevo');
    expect(fd.has('image')).toBe(false);
    expect(fd.has('linkType')).toBe(false);
  });
});

describe('reorder', () => {
  it('envía { items } y devuelve la lista resultante', async () => {
    const items = [{ id: 1, position: 2 }];
    mockedPut.mockResolvedValue(envelope([{ id: 1, position: 2 }]));

    const result = await promoBannerService.reorder(items as never);

    expect(mockedPut).toHaveBeenCalledWith('/promo-banners/reorder', { items });
    expect(result).toHaveLength(1);
  });
});
