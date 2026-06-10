/**
 * @file utils.ts
 * @description Tipos y utilidades puras compartidas por los formularios de
 * creación y edición de joyas: formateo de miles, (de)serialización de
 * especificaciones y validación de archivos de imagen.
 *
 * Todas las funciones son puras (sin estado ni efectos) para poder reutilizarse
 * tanto en `product-create-form` como en `product-edit-form` sin duplicar lógica.
 */

import type { ProductSpecifications } from '../../types/product.types';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
} from './constants';

// ─── Tipos compartidos ──────────────────────────────────────────────────────

/** Fila del editor dinámico de especificaciones (par clave-valor con id estable). */
export interface SpecEntry {
  id: string;
  key: string;
  value: string;
}

/** Claves de error posibles del formulario, en el orden visual del formulario. */
export type ProductFormErrorKey =
  | 'name'
  | 'description'
  | 'categoryId'
  | 'baseWeight'
  | 'additionalValue'
  | 'stock'
  | 'specs'
  | 'images';

/** Mapa de errores por campo. */
export type ProductFormErrors = Partial<Record<ProductFormErrorKey, string>>;

// ─── IDs y formateo numérico ────────────────────────────────────────────────

/** Genera un id corto y único para las filas de especificaciones. */
export const generateId = (): string => Math.random().toString(36).substring(2, 9);

/**
 * Formatea un string de dígitos con separadores de miles (locale colombiano).
 * Ejemplo: `"1200000"` → `"1.200.000"`. Devuelve `""` si no hay número válido.
 *
 * @param raw - String de dígitos (puede venir ya formateado; se limpia primero).
 */
export const formatThousands = (raw: string): string => {
  const num = parseFloat(raw.replace(/[^0-9]/g, ''));
  if (Number.isNaN(num)) return '';
  return num.toLocaleString('es-CO');
};

/**
 * Extrae solo los dígitos de un string formateado.
 * Ejemplo: `"1.200.000"` → `"1200000"`.
 */
export const stripFormatting = (formatted: string): string =>
  formatted.replace(/[^0-9]/g, '');

// ─── Especificaciones ↔ filas del editor ────────────────────────────────────

/**
 * Convierte el objeto `ProductSpecifications` del backend en filas del editor.
 * Los booleanos se convierten a `"true"/"false"` y los arrays a texto separado
 * por comas, para poder editarlos como texto plano.
 */
export const specsToEntries = (specs: ProductSpecifications): SpecEntry[] =>
  Object.entries(specs).map(([key, value]) => ({
    id: generateId(),
    key,
    value: Array.isArray(value)
      ? value.join(', ')
      : typeof value === 'boolean'
        ? String(value)
        : String(value ?? ''),
  }));

/**
 * Construye el objeto `ProductSpecifications` a partir de las filas del editor.
 * Reglas de conversión (se conservan por compatibilidad con datos existentes):
 * - `"true"`/`"false"` → boolean.
 * - Texto con comas → `string[]`.
 * - Resto → string.
 * Las filas con clave o valor vacío se descartan.
 */
export const buildSpecifications = (
  entries: SpecEntry[],
): ProductSpecifications => {
  const specs: ProductSpecifications = {};
  entries.forEach(({ key, value }) => {
    const k = key.trim();
    const v = value.trim();
    if (!k || !v) return;
    if (v.toLowerCase() === 'true') specs[k] = true;
    else if (v.toLowerCase() === 'false') specs[k] = false;
    else if (v.includes(','))
      specs[k] = v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    else specs[k] = v;
  });
  return specs;
};

// ─── Validación de imágenes ─────────────────────────────────────────────────

/** Resultado de validar un lote de archivos de imagen. */
export interface ImageValidation {
  /** Archivos válidos y dentro del cupo disponible. */
  accepted: File[];
  /** Mensaje de error (tipo/tamaño/cupo) o `null` si todo es válido. */
  error: string | null;
  /** Cuántos archivos se descartaron por exceder el cupo disponible. */
  overflow: number;
}

/**
 * Valida un lote de archivos contra tipo, tamaño y cupo disponible. Es la única
 * fuente de validación: tanto el clic como el drag & drop la usan, garantizando
 * el mismo comportamiento.
 *
 * @param files - Archivos a validar (de un input o de `dataTransfer`).
 * @param availableSlots - Cuántas imágenes más se pueden agregar.
 */
export const validateImageFiles = (
  files: File[],
  availableSlots: number,
): ImageValidation => {
  if (files.length === 0) return { accepted: [], error: null, overflow: 0 };

  if (availableSlots <= 0) {
    return {
      accepted: [],
      error: `Ya tienes el máximo de ${MAX_IMAGES} imágenes permitidas.`,
      overflow: files.length,
    };
  }

  if (files.some((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type))) {
    return {
      accepted: [],
      error: 'Solo se permiten imágenes en formato JPG, PNG o WEBP.',
      overflow: 0,
    };
  }

  if (files.some((f) => f.size > MAX_IMAGE_SIZE_BYTES)) {
    return {
      accepted: [],
      error: `Cada imagen debe pesar menos de ${MAX_IMAGE_SIZE_MB} MB.`,
      overflow: 0,
    };
  }

  const accepted = files.slice(0, availableSlots);
  return { accepted, error: null, overflow: files.length - accepted.length };
};
