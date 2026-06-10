/**
 * @file customer.service.ts
 * @description Servicio del módulo de Clientes (panel administrativo).
 * Consume los endpoints admin del backend usando `apiClient` (que adjunta el
 * JWT automáticamente).
 *
 * ## Endpoints que consume
 * - `GET /users?page=&limit=&search=` → listado paginado de clientes
 * - `GET /users/:id/favorites`        → favoritos de un cliente
 */

import { apiClient } from '@/api/api-client';
import type {
  ApiSuccess,
  CustomerFavorite,
  CustomersListResult,
  GetCustomersParams,
} from '@/features/customers/types/customer.types';

export const CustomerService = {
  /**
   * Obtiene una página de clientes con búsqueda opcional.
   *
   * @param params - `page`, `limit` y `search` (todos opcionales).
   * @returns Listado de clientes + metadatos de paginación.
   */
  getCustomers: async (
    params: GetCustomersParams = {},
  ): Promise<CustomersListResult> => {
    const response = await apiClient.get<ApiSuccess<CustomersListResult>>(
      '/users',
      {
        params: {
          ...(params.page !== undefined && { page: params.page }),
          ...(params.limit !== undefined && { limit: params.limit }),
          ...(params.search ? { search: params.search } : {}),
        },
      },
    );
    return response.data.data;
  },

  /**
   * Obtiene todos los favoritos de un cliente (incluye productos no disponibles).
   *
   * @param id - ID del cliente.
   * @returns Lista de favoritos del cliente.
   */
  getCustomerFavorites: async (id: string): Promise<CustomerFavorite[]> => {
    const response = await apiClient.get<ApiSuccess<CustomerFavorite[]>>(
      `/users/${id}/favorites`,
    );
    return response.data.data;
  },
};
