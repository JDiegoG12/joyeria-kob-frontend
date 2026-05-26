/**
 * @file use-is-mobile-chart.ts
 * @description Hook compartido por las gráficas del módulo de métricas
 * para detectar si el viewport está debajo del breakpoint `sm`.
 *
 * Sincronizado con la `media query` de tokens (`max-width: 639px`).
 * Las gráficas lo usan para ajustar márgenes, padding y alturas mínimas
 * de manera responsive sin depender de un `ResizeObserver` propio.
 */

import { useEffect, useState } from 'react';

const MOBILE_MEDIA_QUERY = '(max-width: 639px)';

/**
 * Detecta si el viewport está en tamaño móvil para ajustar el layout
 * de las gráficas. Se sincroniza con cambios de tamaño en tiempo real.
 *
 * @returns `true` cuando el viewport es menor al breakpoint `sm`.
 */
export function useIsMobileChart(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_MEDIA_QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}
