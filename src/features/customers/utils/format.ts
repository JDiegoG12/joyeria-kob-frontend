/**
 * @file format.ts
 * @description Helpers de presentación del módulo de Clientes.
 */

import type { Customer } from '@/features/customers/types/customer.types';

/**
 * Nombre completo del cliente (nombre + apellido), sin espacios sobrantes.
 */
export const fullName = (customer: Customer): string =>
  `${customer.name} ${customer.lastName}`.trim();

/**
 * Formatea una fecha ISO a formato legible en español (ej. `8 jun 2026`).
 *
 * @param iso - Fecha en formato ISO (string del backend).
 */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
