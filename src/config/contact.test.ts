/**
 * @file contact.test.ts
 * @description Tests de los datos y helpers de contacto centralizados de KOB.
 */

import { describe, it, expect } from 'vitest';
import {
  WHATSAPP_PHONE,
  WHATSAPP_URL,
  PHONE_TEL_HREF,
  PHONE_DISPLAY,
  buildWhatsAppUrl,
} from './contact';

describe('constantes de contacto', () => {
  it('expone el número en formato E.164 sin "+" para wa.me', () => {
    expect(WHATSAPP_PHONE).toBe('573135007459');
    expect(WHATSAPP_URL).toBe('https://wa.me/573135007459');
  });

  it('construye el href tel: internacional con "+"', () => {
    expect(PHONE_TEL_HREF).toBe('tel:+573135007459');
  });

  it('formatea el número legible para personas', () => {
    expect(PHONE_DISPLAY).toBe('+57 313 500 7459');
  });
});

describe('buildWhatsAppUrl', () => {
  it('devuelve la URL base cuando no se pasa mensaje', () => {
    expect(buildWhatsAppUrl()).toBe(WHATSAPP_URL);
  });

  it('agrega el mensaje codificado como query param text', () => {
    expect(buildWhatsAppUrl('Hola KOB & Cía')).toBe(
      'https://wa.me/573135007459?text=Hola%20KOB%20%26%20C%C3%ADa',
    );
  });
});
