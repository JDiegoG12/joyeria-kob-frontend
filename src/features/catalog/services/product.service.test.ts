/**
 * @file product.service.test.ts
 * @description Tests del servicio CRUD de productos: construcción de query params
 * del catálogo, armado de FormData (crear/actualizar) y unwrap del envelope.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { productService } from './product.service';
import type { CreateProductPayload } from '../types/product.types';

vi.mock('@/api/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPut = vi.mocked(apiClient.put);

/** Resuelve cualquier método HTTP con el envelope { data: { data } }. */
const envelope = (data: unknown) => ({ data: { success: true, data } });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('productService.getPublic', () => {
  it('no agrega query string cuando no hay categoryId', async () => {
    mockedGet.mockResolvedValue(envelope([]));
    await productService.getPublic();
    expect(mockedGet).toHaveBeenCalledWith('/products');
  });

  it('agrega categoryId al query cuando se provee', async () => {
    mockedGet.mockResolvedValue(envelope([]));
    await productService.getPublic({ categoryId: 7 });
    expect(mockedGet).toHaveBeenCalledWith('/products?categoryId=7');
  });

  it('devuelve [] cuando el backend no trae data', async () => {
    mockedGet.mockResolvedValue({ data: {} });
    await expect(productService.getPublic()).resolves.toEqual([]);
  });
});

describe('productService.getCatalog', () => {
  it('construye el query con todos los filtros provistos', async () => {
    mockedGet.mockResolvedValue(envelope({ products: [] }));
    await productService.getCatalog({
      categoryId: 1,
      minPrice: 500000,
      maxPrice: 5000000,
      search: 'solitario',
      page: 2,
      limit: 12,
    });

    const url = mockedGet.mock.calls[0][0] as string;
    expect(url).toContain('categoryId=1');
    expect(url).toContain('minPrice=500000');
    expect(url).toContain('maxPrice=5000000');
    expect(url).toContain('search=solitario');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=12');
  });

  it('omite los filtros undefined y recorta el término de búsqueda', async () => {
    mockedGet.mockResolvedValue(envelope({ products: [] }));
    await productService.getCatalog({ search: '  anillo  ' });

    const url = mockedGet.mock.calls[0][0] as string;
    expect(url).toBe('/products/catalog?search=anillo');
  });

  it('ignora un search vacío o de solo espacios', async () => {
    mockedGet.mockResolvedValue(envelope({ products: [] }));
    await productService.getCatalog({ search: '   ' });
    expect(mockedGet).toHaveBeenCalledWith('/products/catalog', {
      signal: undefined,
    });
  });

  it('propaga el AbortSignal al cliente HTTP', async () => {
    mockedGet.mockResolvedValue(envelope({ products: [] }));
    const controller = new AbortController();
    await productService.getCatalog({ page: 1 }, controller.signal);
    expect(mockedGet).toHaveBeenCalledWith('/products/catalog?page=1', {
      signal: controller.signal,
    });
  });
});

describe('productService.create', () => {
  const basePayload: CreateProductPayload = {
    name: 'Anillo Solitario',
    description: 'Oro 18k',
    categoryId: 3,
    baseWeight: 4.5,
    additionalValue: 1200000,
    stock: 5,
    specifications: { requiresSize: true },
    imageFiles: [],
  };

  it('envía un FormData con todos los campos del producto', async () => {
    mockedPost.mockResolvedValue(envelope({ id: 'p1' }));
    await productService.create(basePayload);

    const [url, body] = mockedPost.mock.calls[0];
    expect(url).toBe('/products');
    expect(body).toBeInstanceOf(FormData);

    const fd = body as FormData;
    expect(fd.get('name')).toBe('Anillo Solitario');
    expect(fd.get('categoryId')).toBe('3');
    expect(fd.get('baseWeight')).toBe('4.5');
    expect(fd.get('specifications')).toBe(
      JSON.stringify({ requiresSize: true }),
    );
  });
});

describe('productService.update / hide / activate', () => {
  it('update solo incluye los campos presentes en el payload', async () => {
    mockedPut.mockResolvedValue(envelope({ id: 'p1' }));
    await productService.update('p1', { name: 'Nuevo nombre' });

    const fd = mockedPut.mock.calls[0][1] as FormData;
    expect(fd.get('name')).toBe('Nuevo nombre');
    expect(fd.has('stock')).toBe(false);
    expect(fd.has('categoryId')).toBe(false);
  });

  it('hide envía status HIDDEN', async () => {
    mockedPut.mockResolvedValue(envelope({ id: 'p1', status: 'HIDDEN' }));
    await productService.hide('p1');

    const [url, body] = mockedPut.mock.calls[0];
    expect(url).toBe('/products/p1');
    expect((body as FormData).get('status')).toBe('HIDDEN');
  });

  it('activate envía status AVAILABLE', async () => {
    mockedPut.mockResolvedValue(envelope({ id: 'p1', status: 'AVAILABLE' }));
    await productService.activate('p1');
    expect((mockedPut.mock.calls[0][1] as FormData).get('status')).toBe(
      'AVAILABLE',
    );
  });
});
