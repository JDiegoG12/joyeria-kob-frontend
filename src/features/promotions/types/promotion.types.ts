/**
 * @file promotion.types.ts
 * @description Tipos del dominio de promociones de Joyería KOB.
 *
 * Cubre los banners de promoción del carrusel hero de la home. Los descuentos
 * por producto viven en el tipo `Product` (campos `discountValue` y `finalPrice`)
 * y se gestionan a través del servicio de productos.
 */

/** Destino al que apunta un banner de promoción al hacer click. */
export type PromoLinkType = 'PRODUCT' | 'CATEGORY' | 'NONE';

/**
 * Banner de promoción tal como lo devuelve el backend.
 * `imageUrl` es la ruta relativa (`/uploads/promo-banners/...`); se resuelve a
 * URL absoluta con `SERVER_URL` en el punto de render.
 */
export interface PromoBanner {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  position: number;
  linkType: PromoLinkType;
  linkProductId: string | null;
  linkCategoryId: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear un banner. La imagen es obligatoria al crear. */
export interface CreatePromoBannerPayload {
  title?: string;
  subtitle?: string;
  linkType: PromoLinkType;
  linkProductId?: string | null;
  linkCategoryId?: number | null;
  imageFile: File;
}

/** Payload para actualizar un banner. Solo se envían los campos presentes. */
export interface UpdatePromoBannerPayload {
  title?: string;
  subtitle?: string;
  linkType?: PromoLinkType;
  linkProductId?: string | null;
  linkCategoryId?: number | null;
  imageFile?: File;
}

/** Item del reordenamiento: id del banner + su nueva posición (1-indexed). */
export interface ReorderPromoBannerItem {
  id: number;
  position: number;
}

/** Tope máximo de banners de promoción (debe coincidir con el backend). */
export const MAX_PROMO_BANNERS = 10;
