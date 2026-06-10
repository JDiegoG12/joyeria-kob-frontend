/**
 * @file general.service.test.ts
 * @description Tests del servicio de configuración general: precio del oro,
 * y armado del FormData del banner (con/sin imagen y subtítulo).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { GeneralService } from './general.service';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPut = vi.mocked(apiClient.put);
const file = new File(['x'], 'hero.png', { type: 'image/png' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getGoldPrice', () => {
  it('desempaqueta response.data.data', async () => {
    mockedGet.mockResolvedValue({
      data: { success: true, data: { goldPricePerGram: 350000, lastUpdate: 'x' } },
    });

    await expect(GeneralService.getGoldPrice()).resolves.toEqual({
      goldPricePerGram: 350000,
      lastUpdate: 'x',
    });
    expect(mockedGet).toHaveBeenCalledWith('/system/gold-price');
  });
});

describe('updateGoldPrice', () => {
  it('envía el nuevo precio como JSON', async () => {
    mockedPut.mockResolvedValue({ data: { success: true } });
    await GeneralService.updateGoldPrice(400000);
    expect(mockedPut).toHaveBeenCalledWith('/admin/gold-price', {
      goldPricePerGram: 400000,
    });
  });
});

describe('updateBanner', () => {
  it('arma un FormData con título, subtítulo e imagen cuando se proveen', async () => {
    mockedPut.mockResolvedValue({ data: { success: true, data: { id: 1 } } });

    await GeneralService.updateBanner({
      title: 'Colección',
      subtitle: 'Sub',
      imageFile: file,
    });

    const [url, body] = mockedPut.mock.calls[0];
    expect(url).toBe('/banner');
    const fd = body as FormData;
    expect(fd.get('title')).toBe('Colección');
    expect(fd.get('subtitle')).toBe('Sub');
    expect(fd.get('imageFile')).toBe(file);
  });

  it('omite la imagen cuando no se selecciona archivo nuevo', async () => {
    mockedPut.mockResolvedValue({ data: { success: true, data: { id: 1 } } });

    await GeneralService.updateBanner({ title: 'Solo texto' });

    const fd = mockedPut.mock.calls[0][1] as FormData;
    expect(fd.get('title')).toBe('Solo texto');
    expect(fd.has('imageFile')).toBe(false);
    expect(fd.has('subtitle')).toBe(false);
  });
});
