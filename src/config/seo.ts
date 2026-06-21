/**
 * @file seo.ts
 * @description Constantes y utilidades de SEO compartidas por las páginas que
 * inyectan `<title>` y `<meta name="description">` con `react-helmet-async`.
 *
 * Mantener aquí el nombre de marca y el recorte de descripciones evita
 * duplicar literales por toda la app y garantiza que todos los títulos
 * terminen con el mismo sufijo de marca.
 */

/** Nombre de la marca, usado como sufijo en los `<title>` (`… | Joyería KOB`). */
export const SITE_NAME = 'Joyería KOB';

/**
 * Largo máximo recomendado para una meta description antes de que Google la
 * recorte con elipsis en los resultados (~155–160 caracteres).
 */
export const META_DESCRIPTION_MAX = 155;

/**
 * Normaliza y recorta un texto para usarlo como meta description.
 *
 * - Colapsa espacios/saltos de línea en un solo espacio.
 * - Si supera `max` caracteres, corta en el último espacio anterior al límite
 *   y añade una elipsis para no partir palabras a la mitad.
 *
 * @param text - Texto base (p. ej. la descripción real del producto).
 * @param max  - Largo máximo. Por defecto {@link META_DESCRIPTION_MAX}.
 * @returns Descripción lista para `<meta name="description">`.
 */
export const truncateForMeta = (
  text: string,
  max: number = META_DESCRIPTION_MAX,
): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const sliced = clean.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const trimmed = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
  return `${trimmed.trimEnd()}…`;
};
