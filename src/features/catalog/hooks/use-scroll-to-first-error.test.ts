/**
 * @file use-scroll-to-first-error.test.ts
 * @description Tests del hook que desplaza y enfoca el primer campo con error
 * según el orden visual del formulario.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollToFirstError } from './use-scroll-to-first-error';
import type { ProductFormErrors } from '../components/product-form/utils';

/** Crea inputs con id `${prefix}-${key}` para que el hook los encuentre. */
const mountFields = (prefix: string, keys: string[]) => {
  keys.forEach((key) => {
    const input = document.createElement('input');
    input.id = `${prefix}-${key}`;
    document.body.appendChild(input);
  });
};

let scrollSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  document.body.innerHTML = '';
  scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
});

afterEach(() => {
  scrollSpy.mockRestore();
});

describe('useScrollToFirstError', () => {
  it('enfoca y desplaza el primer campo con error según el orden visual', () => {
    mountFields('create', ['name', 'baseWeight']);
    const { result } = renderHook(() => useScrollToFirstError());

    // Aunque baseWeight aparece primero en el objeto, `name` va antes en el orden.
    const errors: ProductFormErrors = {
      baseWeight: 'Requerido',
      name: 'Requerido',
    };

    result.current(errors, 'create');

    expect(document.activeElement?.id).toBe('create-name');
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it('no hace nada cuando no hay errores', () => {
    mountFields('create', ['name']);
    const { result } = renderHook(() => useScrollToFirstError());

    result.current({}, 'create');

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('no falla si el elemento del campo con error no existe en el DOM', () => {
    const { result } = renderHook(() => useScrollToFirstError());

    expect(() =>
      result.current({ stock: 'Requerido' }, 'create'),
    ).not.toThrow();
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
