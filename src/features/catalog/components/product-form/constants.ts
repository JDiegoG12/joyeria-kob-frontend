/**
 * @file constants.ts
 * @description Constantes y clases utilitarias compartidas por los formularios
 * de creación y edición de joyas (`product-create-form` y `product-edit-form`).
 *
 * Centralizar estos valores evita que ambos formularios se desincronicen: un
 * cambio de límite o de estilo se aplica una sola vez aquí.
 */

// ─── Límites del formulario ─────────────────────────────────────────────────

/** Número máximo de imágenes por joya. */
export const MAX_IMAGES = 5;

/** Longitud máxima del nombre de la joya. */
export const MAX_NAME_LENGTH = 120;

/** Longitud máxima de la descripción. */
export const MAX_DESCRIPTION_LENGTH = 800;

/**
 * Tipos MIME de imagen aceptados. Se tipa como `string[]` (no tupla `const`)
 * para que `Array.prototype.includes(file.type)` funcione sin casts.
 */
export const ACCEPTED_IMAGE_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** Tamaño máximo por imagen, en megabytes. */
export const MAX_IMAGE_SIZE_MB = 25;

/** Tamaño máximo por imagen, en bytes (derivado de `MAX_IMAGE_SIZE_MB`). */
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// ─── Clases reutilizables ───────────────────────────────────────────────────

/** Clases base para inputs de texto, número y selects del formulario. */
export const INPUT_BASE =
  'w-full rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:border-[var(--border-strong)]';

/** Clases para el botón primario de acción (Crear / Guardar). */
export const BTN_PRIMARY =
  'rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-text)] shadow-[var(--shadow-accent)] transition hover:opacity-90 active:scale-95 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

/** Clases para botones secundarios con borde (Cancelar / Cerrar). */
export const BTN_SECONDARY =
  'rounded-xl border border-[var(--border-color)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';
