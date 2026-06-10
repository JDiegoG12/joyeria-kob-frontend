/**
 * @file get-error-message.test.ts
 * @description Tests del extractor de mensajes de error legibles.
 */

import { describe, it, expect } from 'vitest';
import { getApiErrorMessage } from './get-error-message';

describe('getApiErrorMessage', () => {
  it('prioriza el mensaje del backend (response.data.message)', () => {
    const error = {
      response: { data: { message: 'Credenciales inválidas' } },
      message: 'Request failed',
    };
    expect(getApiErrorMessage(error, 'fallback')).toBe('Credenciales inválidas');
  });

  it('usa error.message cuando no hay mensaje del backend', () => {
    const error = new Error('Algo falló');
    expect(getApiErrorMessage(error, 'fallback')).toBe('Algo falló');
  });

  it('ignora un mensaje del backend vacío o solo espacios y cae a error.message', () => {
    const error = {
      response: { data: { message: '   ' } },
      message: 'mensaje plano',
    };
    expect(getApiErrorMessage(error, 'fallback')).toBe('mensaje plano');
  });

  it('devuelve el fallback cuando no hay ningún mensaje utilizable', () => {
    expect(getApiErrorMessage({}, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage({ message: 42 }, 'fallback')).toBe('fallback');
  });

  it('devuelve el fallback cuando el error no es un objeto', () => {
    expect(getApiErrorMessage('error string', 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(undefined, 'fallback')).toBe('fallback');
  });
});
