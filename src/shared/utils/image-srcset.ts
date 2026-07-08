/**
 * @file image-srcset.ts
 * @description Helpers para servir variantes pequeñas (miniaturas) de las
 * imágenes de `/uploads` mediante `srcset`, evitando descargar la versión
 * grande (1000x1000 para productos, 1080x1920 para social-content) en
 * contenedores chicos como las tarjetas de catálogo, destacados y los
 * carruseles de redes.
 *
 * El backend genera, para cada imagen de `products` y `social-content`, una
 * miniatura derivada con sufijo `-thumb` (p. ej. `uuid-thumb.webp`). Las
 * imágenes subidas antes de esa generación se crean **bajo demanda** en el
 * primer request (middleware `thumbnailOnDemand` del backend), por lo que estos
 * `srcset` son seguros tanto para imágenes nuevas como antiguas.
 *
 * Las anchuras (`thumb`/`full`) deben coincidir con las del procesador del
 * backend (`THUMBNAIL_SPECS` / `FULL_SPECS` en `image.processor.ts`).
 */

/** Solo derivamos miniatura para `.webp` servidos desde nuestro `/uploads`. */
const UPLOADS_WEBP = /\/uploads\/[^?]+\.webp$/i;

/** Inserta `-thumb` antes de la extensión `.webp`. */
const toThumbnailUrl = (url: string): string =>
  url.replace(/\.webp$/i, '-thumb.webp');

/** Anchuras reales (px) de las variantes generadas por el backend. */
export interface SrcSetWidths {
  /** Ancho de la miniatura. */
  thumb: number;
  /** Ancho de la imagen grande. */
  full: number;
}

/** Variantes de imágenes de producto (`products`). */
export const PRODUCT_IMAGE_WIDTHS: SrcSetWidths = { thumb: 400, full: 1000 };

/** Variantes de imágenes de social-content (vertical 9:16). */
export const SOCIAL_IMAGE_WIDTHS: SrcSetWidths = { thumb: 600, full: 1080 };

/** Variantes del banner del hero (16:9, ancho completo del viewport). */
export const BANNER_IMAGE_WIDTHS: SrcSetWidths = { thumb: 1280, full: 1920 };

/**
 * Construye un `srcSet` (miniatura + grande) para una imagen de `/uploads`.
 * Devuelve `undefined` si la URL no es un `.webp` de nuestro backend (por
 * ejemplo, una imagen de fallback externa de Unsplash), para no emitir un
 * candidato que daría 404.
 *
 * @param url    URL absoluta ya resuelta de la imagen grande.
 * @param widths Anchuras de las variantes (producto o social).
 */
export const buildUploadsSrcSet = (
  url: string,
  widths: SrcSetWidths,
): string | undefined => {
  if (!UPLOADS_WEBP.test(url)) return undefined;
  return `${toThumbnailUrl(url)} ${widths.thumb}w, ${url} ${widths.full}w`;
};
