/**
 * @file use-page-views.ts
 * @description Hook que registra una vista de página en GA4 cada vez que cambia
 * la ruta dentro del SPA.
 *
 * Debe usarse DENTRO del contexto del router (depende de `useLocation`), por eso
 * vive en el `RootLayout` que envuelve todo el árbol de rutas, y no en `App`.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { trackPageView } from '@/analytics/google-analytics';

/**
 * Suscribe el componente a los cambios de ubicación y envía un `page_view` a
 * GA4 en cada navegación (incluida la carga inicial).
 */
export const usePageViews = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
};
