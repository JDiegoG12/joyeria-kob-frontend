/**
 * @file google-analytics.ts
 * @description Capa de integración con Google Analytics 4 (GA4) vía `react-ga4`.
 *
 * GA4 se controla con la variable de entorno `VITE_GA_MEASUREMENT_ID`:
 * - Si está definida → se inicializa gtag y se envían vistas de página.
 * - Si está vacía (típico en desarrollo) → todas las funciones son no-op,
 *   así no se contamina la propiedad de GA con tráfico local.
 *
 * Al ser un SPA, GA4 NO detecta los cambios de ruta por sí solo: las vistas de
 * página se envían manualmente desde `usePageViews` (ver `@/hooks/use-page-views`).
 */

import ReactGA from 'react-ga4';

/** ID de medición de GA4 (formato `G-XXXXXXXXXX`). Vacío = analytics desactivado. */
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/** `true` cuando hay un ID configurado y, por tanto, GA4 está activo. */
export const GA_ENABLED = Boolean(GA_ID);

/** Evita reinicializar gtag si `initGA` se llama más de una vez. */
let initialized = false;

/**
 * Inicializa GA4 una sola vez. No hace nada si no hay ID configurado o si ya
 * se inicializó previamente. Llamar al montar la app (ver `App.tsx`).
 */
export const initGA = () => {
  if (!GA_ENABLED || initialized) return;
  ReactGA.initialize(GA_ID as string);
  initialized = true;
};

/**
 * Envía una vista de página a GA4 para la ruta indicada.
 *
 * @param path - Ruta a registrar, normalmente `pathname + search`.
 */
export const trackPageView = (path: string) => {
  if (!GA_ENABLED) return;
  ReactGA.send({ hitType: 'pageview', page: path });
};
