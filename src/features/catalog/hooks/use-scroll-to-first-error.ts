/**
 * @file use-scroll-to-first-error.ts
 * @description Hook que, tras un envío inválido, desplaza el formulario hasta el
 * PRIMER campo con error y le da foco. Resuelve el problema de no enterarse de
 * errores en campos superiores cuando se envía desde el pie del formulario.
 *
 * Cada campo del formulario expone un `id` con el patrón `${prefijo}-${clave}`
 * (ej: `create-name`, `edit-additionalValue`). El hook recorre las claves en el
 * orden visual del formulario y se desplaza al primero que tenga error.
 *
 * Respeta `prefers-reduced-motion`: usa scroll instantáneo si el usuario lo pide.
 */

import { useCallback } from 'react';
import type {
  ProductFormErrorKey,
  ProductFormErrors,
} from '../components/product-form/utils';

/** Orden visual de los campos, usado para elegir el "primer" error. */
const FIELD_ORDER: ProductFormErrorKey[] = [
  'name',
  'description',
  'categoryId',
  'baseWeight',
  'additionalValue',
  'stock',
  'specs',
  'images',
];

/**
 * Devuelve una función `scrollToFirstError(errors, idPrefix)` que desplaza y
 * enfoca el primer campo con error según el orden visual del formulario.
 */
export const useScrollToFirstError = () => {
  return useCallback((errors: ProductFormErrors, idPrefix: string) => {
    const firstKey = FIELD_ORDER.find((key) => errors[key]);
    if (!firstKey) return;

    const el = document.getElementById(`${idPrefix}-${firstKey}`);
    if (!el) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    el.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'center',
    });

    // `preventScroll` evita un segundo salto que pelearía con el scrollIntoView.
    el.focus({ preventScroll: true });
  }, []);
};
