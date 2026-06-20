/**
 * @file contact.ts
 * @description Datos de contacto centralizados de Joyería KOB.
 *
 * Fuente única de verdad para el número de WhatsApp / teléfono, sus formatos
 * de presentación y los helpers para construir enlaces.
 *
 * Antes el número vivía repetido —y con formatos divergentes (`573135007459`,
 * `3135007459`, `313 5007459`, `313 500 7459`)— en footer, navbar, mobile-menu,
 * hero, modal de detalle, favoritos y home. Centralizarlo elimina esas
 * inconsistencias y reduce un cambio de número a una sola línea.
 *
 * @example
 * ```ts
 * import { WHATSAPP_URL, buildWhatsAppUrl } from '@/config/contact';
 *
 * <a href={WHATSAPP_URL}>Hablar por WhatsApp</a>
 * <a href={buildWhatsAppUrl('Hola, me interesa una joya...')}>Consultar</a>
 * ```
 */

/** Código de país (Colombia), solo dígitos. */
const COUNTRY_CODE = '57';

/** Número nacional, solo dígitos (sin código de país ni espacios). */
const NATIONAL_NUMBER = '3135007459';

/** Número nacional formateado para lectura humana, ej. `313 500 7459`. */
const NATIONAL_DISPLAY = '313 500 7459';

/**
 * Número completo en formato E.164 sin el `+` — lo que espera `wa.me`.
 * @example '573135007459'
 */
export const WHATSAPP_PHONE = `${COUNTRY_CODE}${NATIONAL_NUMBER}`;

/** URL base de WhatsApp (sin mensaje). */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`;

/** `href` para enlaces `tel:` en formato internacional con `+`. */
export const PHONE_TEL_HREF = `tel:+${WHATSAPP_PHONE}`;

/** Número para mostrar a personas, internacional. @example '+57 313 500 7459' */
export const PHONE_DISPLAY = `+${COUNTRY_CODE} ${NATIONAL_DISPLAY}`;

/** Número para mostrar a personas, solo parte nacional. @example '313 500 7459' */
export const PHONE_DISPLAY_NATIONAL = NATIONAL_DISPLAY;

/**
 * Construye una URL de WhatsApp con un mensaje pre-redactado opcional.
 *
 * @param message - Texto a precargar en el chat. Si se omite, abre sin mensaje.
 * @returns URL lista para `href` o `window.open`.
 */
export const buildWhatsAppUrl = (message?: string): string =>
  message ? `${WHATSAPP_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_URL;

/**
 * Mensajes pre-redactados para los CTA de WhatsApp **genéricos** del storefront,
 * de modo que el chat se abra con un texto alusivo al punto desde el que se hizo
 * clic (navbar, hero, footer…) en lugar de un chat vacío.
 *
 * Los CTA con contexto propio construyen su mensaje aparte: el detalle de
 * producto (`product-detail-modal`), las tarjetas de servicio (`home-page`) y la
 * lista de favoritos (`favorites-whatsapp`).
 */
export const WHATSAPP_MESSAGES = {
  /** Contacto general: navbar, menú móvil y footer ("Hablar por WhatsApp"). */
  generalInquiry:
    'Hola, me gustaría recibir más información sobre Joyería KOB. ¿Podrían ayudarme?',
  /** CTA "Hablar con asesor" del hero. */
  heroAdvisor:
    'Hola, me gustaría hablar con un asesor de Joyería KOB para conocer sus joyas. ¿Podrían orientarme?',
  /** CTA "Quiero ser distribuidor" del footer. */
  distributor:
    'Hola, soy fabricante o importador de joyería y me gustaría ser distribuidor de Joyería KOB. Me gustaría enviarles mi catálogo.',
} as const;
