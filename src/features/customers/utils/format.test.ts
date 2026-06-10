/**
 * @file format.test.ts
 * @description Tests de los helpers de presentación del módulo de Clientes.
 */

import { describe, it, expect } from 'vitest';
import type { Customer } from '@/features/customers/types/customer.types';
import { fullName, formatDate } from './format';

/** Crea un Customer mínimo para los tests (solo los campos que usa el helper). */
const makeCustomer = (name: string, lastName: string): Customer =>
  ({ name, lastName }) as Customer;

describe('fullName', () => {
  it('une nombre y apellido con un espacio', () => {
    expect(fullName(makeCustomer('Ana', 'Pérez'))).toBe('Ana Pérez');
  });

  it('recorta el espacio sobrante cuando el apellido está vacío', () => {
    expect(fullName(makeCustomer('Ana', ''))).toBe('Ana');
  });
});

describe('formatDate', () => {
  it('formatea una fecha ISO al formato legible es-CO (día mes año)', () => {
    // Se usa mediodía UTC para evitar que el desfase horario cambie el día.
    // La presencia de "de" depende de la versión de ICU, por eso se asierta
    // por las partes (día / mes abreviado / año) y no por el string exacto.
    const formatted = formatDate('2026-06-08T12:00:00.000Z');
    expect(formatted).toMatch(/8/);
    expect(formatted).toMatch(/jun/);
    expect(formatted).toMatch(/2026/);
  });
});
