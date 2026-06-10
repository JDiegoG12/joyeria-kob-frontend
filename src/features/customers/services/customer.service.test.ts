/**
 * @file customer.service.test.ts
 * @description Tests del servicio del módulo de Clientes: construcción de los
 * params de paginación/búsqueda y unwrap del envelope.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { CustomerService } from './customer.service';

vi.mock('@/api/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CustomerService.getCustomers', () => {
  it('envía page, limit y search cuando están presentes', async () => {
    mockedGet.mockResolvedValue({
      data: { success: true, data: { customers: [], pagination: null } },
    });

    await CustomerService.getCustomers({ page: 2, limit: 10, search: 'ana' });

    expect(mockedGet).toHaveBeenCalledWith('/users', {
      params: { page: 2, limit: 10, search: 'ana' },
    });
  });

  it('omite search cuando es una cadena vacía', async () => {
    mockedGet.mockResolvedValue({
      data: { success: true, data: { customers: [], pagination: null } },
    });

    await CustomerService.getCustomers({ page: 1, limit: 10, search: '' });

    expect(mockedGet).toHaveBeenCalledWith('/users', {
      params: { page: 1, limit: 10 },
    });
  });

  it('envía params vacíos cuando no se pasa nada', async () => {
    mockedGet.mockResolvedValue({
      data: { success: true, data: { customers: [], pagination: null } },
    });

    await CustomerService.getCustomers();
    expect(mockedGet).toHaveBeenCalledWith('/users', { params: {} });
  });

  it('devuelve el contenido de response.data.data', async () => {
    const result = { customers: [{ id: '1' }], pagination: { total: 1 } };
    mockedGet.mockResolvedValue({ data: { success: true, data: result } });

    await expect(CustomerService.getCustomers()).resolves.toBe(result);
  });
});

describe('CustomerService.getCustomerFavorites', () => {
  it('consume GET /users/:id/favorites y devuelve la lista', async () => {
    const favorites = [{ id: 1 }, { id: 2 }];
    mockedGet.mockResolvedValue({ data: { success: true, data: favorites } });

    await expect(CustomerService.getCustomerFavorites('abc')).resolves.toBe(
      favorites,
    );
    expect(mockedGet).toHaveBeenCalledWith('/users/abc/favorites');
  });
});
