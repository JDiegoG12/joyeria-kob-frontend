/**
 * @file contact.test.ts
 * @description Tests de los helpers de contacto hacia un cliente: normalización
 * de teléfonos y construcción de URLs de WhatsApp y mailto.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  buildCustomerWhatsAppUrl,
  buildMailtoUrl,
} from './contact';

describe('normalizePhone', () => {
  it('antepone el código de país 57 a un celular colombiano de 10 dígitos que empieza por 3', () => {
    expect(normalizePhone('3135007459')).toBe('573135007459');
  });

  it('limpia espacios y guiones antes de evaluar la regla de 10 dígitos', () => {
    expect(normalizePhone('313 500-7459')).toBe('573135007459');
  });

  it('no toca un número que ya viene con código de país (más de 10 dígitos)', () => {
    expect(normalizePhone('573135007459')).toBe('573135007459');
  });

  it('no antepone 57 si los 10 dígitos no empiezan por 3 (no es celular típico)', () => {
    expect(normalizePhone('6015007459')).toBe('6015007459');
  });

  it('devuelve null cuando no quedan dígitos', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('sin número')).toBeNull();
  });
});

describe('buildCustomerWhatsAppUrl', () => {
  it('construye la URL base wa.me con el teléfono normalizado', () => {
    expect(buildCustomerWhatsAppUrl('3135007459')).toBe(
      'https://wa.me/573135007459',
    );
  });

  it('agrega el mensaje codificado como query param text', () => {
    expect(buildCustomerWhatsAppUrl('3135007459', 'Hola, ¿cómo estás?')).toBe(
      'https://wa.me/573135007459?text=Hola%2C%20%C2%BFc%C3%B3mo%20est%C3%A1s%3F',
    );
  });

  it('devuelve null si el teléfono es null o undefined', () => {
    expect(buildCustomerWhatsAppUrl(null)).toBeNull();
    expect(buildCustomerWhatsAppUrl(undefined)).toBeNull();
  });

  it('devuelve null si el teléfono no contiene dígitos', () => {
    expect(buildCustomerWhatsAppUrl('---')).toBeNull();
  });
});

describe('buildMailtoUrl', () => {
  it('devuelve un mailto simple cuando no hay subject ni body', () => {
    expect(buildMailtoUrl('cliente@kob.com')).toBe('mailto:cliente@kob.com');
  });

  it('agrega subject y body codificados como query params', () => {
    const url = buildMailtoUrl('cliente@kob.com', 'Asunto', 'Cuerpo del correo');
    expect(url).toBe(
      'mailto:cliente@kob.com?subject=Asunto&body=Cuerpo+del+correo',
    );
  });

  it('incluye solo el subject cuando el body se omite', () => {
    expect(buildMailtoUrl('cliente@kob.com', 'Solo asunto')).toBe(
      'mailto:cliente@kob.com?subject=Solo+asunto',
    );
  });
});
