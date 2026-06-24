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
import { EMAIL, PHONE_TEL_HREF } from '@/config/contact';

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

/**
 * Datos del negocio físico, fuente única para el JSON-LD de `JewelryStore` y
 * para la UI de la sección "Visítanos" (mismos valores → schema y pantalla
 * nunca divergen).
 */
export const BUSINESS = {
  streetAddress: 'Carrera 3, Los Estudiantes #5-27',
  locality: 'El Bordo',
  region: 'Cauca',
  country: 'CO',
  /** Coordenadas tomadas de la ficha de Google Maps del negocio. */
  latitude: 2.1131983,
  longitude: -76.9856187,
  /** Enlace de "Cómo llegar" (ruta hacia las coordenadas en Google Maps). */
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=2.1131983,-76.9856187',
  /** `src` del iframe "Insertar un mapa" de Google Maps (ficha del negocio). */
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.1049496278783!2d-76.9856187!3d2.1131983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2fc70022879a6b%3A0xb6e0140f1ab92704!2sJOYERIA%20KOB!5e0!3m2!1ses-419!2sco!4v1782322315372!5m2!1ses-419!2sco',
} as const;

/**
 * JSON-LD del negocio local (`schema.org/JewelryStore`, subtipo de
 * `LocalBusiness`). Es la pieza SEO clave para búsquedas locales, Google Maps y
 * el panel de conocimiento: declara dirección, geolocalización, teléfono,
 * horarios y perfiles sociales.
 *
 * Se incrusta en la home (donde vive la sección "Visítanos").
 *
 * Espejado en el backend (`buildLocalBusinessJsonLd` de
 * `joyeria-kob-backend/src/features/render/utils/json-ld.ts`), que lo emite en
 * el HTML pre-renderizado de la home para los bots, igual que `Organization` y
 * `Product`. Ambos lados deben emitir datos idénticos; si cambia uno, actualizar
 * el otro.
 */
export const buildLocalBusinessJsonLd = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: SITE_NAME,
  url: SITE_URL,
  image: ORGANIZATION_LOGO_URL,
  logo: ORGANIZATION_LOGO_URL,
  telephone: PHONE_TEL_HREF.replace('tel:', ''),
  email: EMAIL,
  priceRange: '$$',
  sameAs: ORGANIZATION_SAME_AS,
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.locality,
    addressRegion: BUSINESS.region,
    addressCountry: BUSINESS.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.latitude,
    longitude: BUSINESS.longitude,
  },
  // Lun–Sáb 09:00–18:00; domingo cerrado (se omite el día sin atención).
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      opens: '09:00',
      closes: '18:00',
    },
  ],
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
