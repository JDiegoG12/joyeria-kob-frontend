/**
 * @file use-is-mobile-chart.test.ts
 * @description Tests del hook que detecta el viewport móvil vía matchMedia,
 * incluida la reacción a cambios de tamaño.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobileChart } from './use-is-mobile-chart';

/** MediaQueryList controlable: permite emitir cambios a los listeners. */
const createMql = (initial: boolean) => {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const mql = {
    matches: initial,
    addEventListener: (_event: string, cb: (e: { matches: boolean }) => void) =>
      listeners.add(cb),
    removeEventListener: (
      _event: string,
      cb: (e: { matches: boolean }) => void,
    ) => listeners.delete(cb),
    emit: (matches: boolean) => {
      mql.matches = matches;
      listeners.forEach((cb) => cb({ matches }));
    },
  };
  return mql;
};

let mql: ReturnType<typeof createMql>;

beforeEach(() => {
  mql = createMql(false);
  vi.stubGlobal('matchMedia', vi.fn(() => mql));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useIsMobileChart', () => {
  it('devuelve false cuando el viewport no es móvil', () => {
    const { result } = renderHook(() => useIsMobileChart());
    expect(result.current).toBe(false);
  });

  it('devuelve true cuando el viewport ya es móvil al montar', () => {
    mql = createMql(true);
    const { result } = renderHook(() => useIsMobileChart());
    expect(result.current).toBe(true);
  });

  it('reacciona a un cambio de tamaño en tiempo real', () => {
    const { result } = renderHook(() => useIsMobileChart());
    expect(result.current).toBe(false);

    act(() => mql.emit(true));
    expect(result.current).toBe(true);
  });
});
