/**
 * @file customer.types.ts
 * @description Tipos TypeScript del módulo de Clientes (panel administrativo).
 * Reflejan exactamente los contratos de los endpoints admin del backend:
 * - `GET /api/users`               → listado paginado de clientes
 * - `GET /api/users/:id/favorites` → favoritos de un cliente
 */

import type { FavoriteItem } from '@/features/favorites/types/favorite.types';

// ─── Modelo principal ─────────────────────────────────────────────────────────

/**
 * Cliente tal como lo devuelve el listado del backend.
 * Nunca incluye la contraseña. `favoritesCount` viene aplanado del `_count`.
 */
export interface Customer {
  id: string;
  name: string;
  lastName: string;
  phone: string | null;
  email: string;
  role: 'CLIENT' | 'ADMIN';
  createdAt: string;
  /** Cantidad de productos que el cliente tiene en favoritos. */
  favoritesCount: number;
}

/**
 * Favorito de un cliente para la vista admin.
 *
 * Mismo shape que el favorito de la tienda, pero el endpoint admin puede
 * devolver productos NO disponibles (el admin ve el historial completo).
 */
export type CustomerFavorite = FavoriteItem;

// ─── Paginación ───────────────────────────────────────────────────────────────

/**
 * Metadatos de paginación devueltos por el backend.
 */
export interface CustomersPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Resultado del listado paginado de clientes (`data` de la respuesta).
 */
export interface CustomersListResult {
  customers: Customer[];
  pagination: CustomersPagination;
}

/**
 * Parámetros aceptados por el endpoint de listado de clientes.
 */
export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Respuestas del backend ───────────────────────────────────────────────────

/**
 * Envoltorio estándar de respuestas exitosas del backend.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}
