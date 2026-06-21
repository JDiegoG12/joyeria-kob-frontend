/**
 * @file structured-data.ts
 * @description Builders de datos estructurados schema.org (JSON-LD).
 *
 * La MISMA estructura se replica en el backend
 * (`src/features/render/utils/json-ld.ts` de joyeria-kob-backend), que la
 * incrusta en el HTML pre-renderizado para bots. Ambos lados deben emitir datos
 * idénticos; si cambia uno, actualizar el otro.
 *
 * Estos builders devuelven objetos planos. Se serializan a `<script
 * type="application/ld+json">` con `JSON.stringify` vía `react-helmet-async`.
 */

import { SERVER_URL } from '@/api/server-url';
import { buildProductSlug } from '@/features/catalog/utils/product-slug';
import type { Product } from '@/features/catalog/types/product.types';
import { SITE_NAME, SITE_URL } from '@/config/seo';

/** URL absoluta y estable del logo (servido desde public/). Igual en el backend. */
export const ORGANIZATION_LOGO_URL = `${SITE_URL}/LogoKOB.svg`;

/** Perfiles sociales oficiales (sameAs). Igual en el backend. */
export const ORGANIZATION_SAME_AS = [
  'https://www.instagram.com/joyeria_kob',
  'https://www.tiktok.com/@joyeria_kob',
];

/** JSON-LD de la organización (marca). Se incrusta en el layout raíz. */
export const buildOrganizationJsonLd = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: ORGANIZATION_LOGO_URL,
  sameAs: ORGANIZATION_SAME_AS,
});

/** Construye la URL absoluta de una imagen de producto (servida por el backend). */
const productImageUrl = (filename: string): string =>
  `${SERVER_URL}/uploads/products/${filename}`;

/**
 * JSON-LD de un producto (schema.org/Product). Se incrusta en `ProductPage`.
 * Mantiene la misma forma que `buildProductJsonLd` del backend.
 */
export const buildProductJsonLd = (
  product: Product,
): Record<string, unknown> => {
  const description =
    product.description?.trim() ||
    `${product.name} en oro 18k, diseño personalizado de ${SITE_NAME}.`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map(productImageUrl),
    description,
    sku: product.id,
    brand: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      // Precio numérico sin separadores de miles (lo que paga el cliente).
      price: Math.round(product.finalPrice),
      priceCurrency: 'COP',
      availability:
        product.status === 'AVAILABLE'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/producto/${buildProductSlug(product)}`,
    },
  };
};
