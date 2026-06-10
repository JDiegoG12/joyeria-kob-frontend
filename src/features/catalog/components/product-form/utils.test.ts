/**
 * @file utils.test.ts
 * @description Tests de las utilidades puras de los formularios de joya:
 * formateo de miles, (de)serialización de especificaciones y validación de
 * archivos de imagen.
 */

import { describe, it, expect } from 'vitest';
import {
  formatThousands,
  stripFormatting,
  specsToEntries,
  buildSpecifications,
  validateImageFiles,
  type SpecEntry,
} from './utils';
import {
  MAX_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
} from './constants';

/**
 * Crea un objeto con la forma mínima de `File` que consume `validateImageFiles`
 * (solo lee `type` y `size`), evitando generar contenido real de gran tamaño.
 */
const makeFile = (type: string, size: number): File =>
  ({ type, size }) as unknown as File;

const okImage = (size = 1024) => makeFile('image/png', size);

describe('formatThousands / stripFormatting', () => {
  it('formatea un string de dígitos con separadores de miles es-CO', () => {
    expect(formatThousands('1200000')).toBe('1.200.000');
  });

  it('limpia primero los caracteres no numéricos antes de formatear', () => {
    expect(formatThousands('1.200.000')).toBe('1.200.000');
  });

  it('devuelve cadena vacía cuando no hay número válido', () => {
    expect(formatThousands('')).toBe('');
    expect(formatThousands('abc')).toBe('');
  });

  it('stripFormatting deja solo los dígitos', () => {
    expect(stripFormatting('1.200.000')).toBe('1200000');
  });

  it('hace round-trip dígitos → formateado → dígitos', () => {
    const raw = '4500000';
    expect(stripFormatting(formatThousands(raw))).toBe(raw);
  });
});

describe('specsToEntries', () => {
  it('convierte booleanos a "true"/"false" y arrays a texto separado por comas', () => {
    const entries = specsToEntries({
      requiresSize: true,
      hasStones: false,
      materials: ['oro', 'plata'],
      karat: '18k',
    });

    const byKey = Object.fromEntries(entries.map((e) => [e.key, e.value]));
    expect(byKey.requiresSize).toBe('true');
    expect(byKey.hasStones).toBe('false');
    expect(byKey.materials).toBe('oro, plata');
    expect(byKey.karat).toBe('18k');
  });

  it('asigna un id a cada fila', () => {
    const entries = specsToEntries({ a: '1', b: '2' });
    expect(entries).toHaveLength(2);
    entries.forEach((e) => expect(e.id).toBeTruthy());
  });
});

describe('buildSpecifications', () => {
  const entry = (key: string, value: string): SpecEntry => ({
    id: key,
    key,
    value,
  });

  it('convierte "true"/"false" a boolean (case-insensitive)', () => {
    const specs = buildSpecifications([
      entry('requiresSize', 'TRUE'),
      entry('hasStones', 'false'),
    ]);
    expect(specs.requiresSize).toBe(true);
    expect(specs.hasStones).toBe(false);
  });

  it('convierte texto con comas en un array de strings recortados', () => {
    const specs = buildSpecifications([entry('materials', 'oro , plata ,')]);
    expect(specs.materials).toEqual(['oro', 'plata']);
  });

  it('descarta filas con clave o valor vacío', () => {
    const specs = buildSpecifications([
      entry('', 'sin clave'),
      entry('sinValor', '   '),
      entry('valida', 'ok'),
    ]);
    expect(specs).toEqual({ valida: 'ok' });
  });

  it('es inverso de specsToEntries para valores soportados', () => {
    const original = { requiresSize: true, materials: ['oro', 'plata'] };
    expect(buildSpecifications(specsToEntries(original))).toEqual(original);
  });
});

describe('validateImageFiles', () => {
  it('no produce error ni overflow cuando la lista está vacía', () => {
    expect(validateImageFiles([], 5)).toEqual({
      accepted: [],
      error: null,
      overflow: 0,
    });
  });

  it('rechaza todo cuando no quedan cupos disponibles', () => {
    const result = validateImageFiles([okImage()], 0);
    expect(result.accepted).toHaveLength(0);
    expect(result.overflow).toBe(1);
    expect(result.error).toContain(String(MAX_IMAGES));
  });

  it('rechaza tipos MIME no permitidos', () => {
    const result = validateImageFiles([makeFile('application/pdf', 1024)], 5);
    expect(result.accepted).toHaveLength(0);
    expect(result.error).toMatch(/JPG, PNG o WEBP/);
  });

  it('rechaza imágenes que exceden el tamaño máximo', () => {
    const result = validateImageFiles(
      [okImage(MAX_IMAGE_SIZE_BYTES + 1)],
      5,
    );
    expect(result.accepted).toHaveLength(0);
    expect(result.error).toContain(String(MAX_IMAGE_SIZE_MB));
  });

  it('acepta hasta los cupos disponibles y reporta el resto como overflow', () => {
    const files = [okImage(), okImage(), okImage()];
    const result = validateImageFiles(files, 2);
    expect(result.accepted).toHaveLength(2);
    expect(result.overflow).toBe(1);
    expect(result.error).toBeNull();
  });
});
