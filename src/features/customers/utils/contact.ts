/**
 * @file contact.ts
 * @description Helpers para construir enlaces de contacto hacia un CLIENTE
 * desde el panel administrativo.
 *
 * A diferencia de `@/config/contact` (que apunta SIEMPRE al número de la
 * joyería), estos helpers usan el correo / teléfono del propio cliente para que
 * el administrador lo contacte. Las acciones abren la app del admin (cliente de
 * correo o WhatsApp), sin envío server-side.
 */

/** Código de país por defecto (Colombia) para números sin prefijo internacional. */
const DEFAULT_COUNTRY_CODE = '57';

/**
 * Normaliza un teléfono a formato apto para `wa.me` (solo dígitos, con país).
 *
 * Reglas:
 * - Se eliminan todos los caracteres que no son dígitos.
 * - Si quedan 10 dígitos y empieza por `3` (celular colombiano típico), se
 *   antepone el código de país `57`. En cualquier otro caso se asume que el
 *   número ya viene con el código de país.
 *
 * @param phone - Teléfono crudo tal como lo registró el cliente.
 * @returns Dígitos listos para `wa.me`, o `null` si no hay dígitos.
 */
export const normalizePhone = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length === 10 && digits.startsWith('3')) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }
  return digits;
};

/**
 * Construye una URL de WhatsApp (`wa.me`) para escribirle a un cliente.
 *
 * @param phone - Teléfono del cliente (puede venir con espacios/guiones).
 * @param message - Mensaje opcional pre-redactado.
 * @returns URL lista para `window.open`, o `null` si el teléfono no es válido.
 */
export const buildCustomerWhatsAppUrl = (
  phone: string | null | undefined,
  message?: string,
): string | null => {
  if (!phone) return null;
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

/**
 * Construye un enlace `mailto:` para escribirle un correo a un cliente.
 *
 * @param email - Correo del cliente.
 * @param subject - Asunto opcional.
 * @param body - Cuerpo opcional.
 * @returns URL `mailto:` lista para `window.open` o un `<a href>`.
 */
export const buildMailtoUrl = (
  email: string,
  subject?: string,
  body?: string,
): string => {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);

  const query = params.toString();
  return query ? `mailto:${email}?${query}` : `mailto:${email}`;
};
