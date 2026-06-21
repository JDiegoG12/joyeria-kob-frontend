/**
 * @file root-layout.tsx
 * @description Layout raíz del enrutador. No aporta UI visible: sus funciones
 * son (1) ejecutar el tracking global de vistas de página (`usePageViews`) en
 * un único punto que cubre TODAS las rutas y (2) inyectar el JSON-LD de
 * `Organization` (datos estructurados de marca) en todas las páginas.
 *
 * Renderiza `<Outlet />`, de modo que los layouts hijos (MainLayout, AuthLayout,
 * AdminLayout) y sus páginas se montan sin cambios.
 */

import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { usePageViews } from '@/hooks/use-page-views';
import { buildOrganizationJsonLd } from '@/config/structured-data';

/** JSON-LD de la organización. Constante: no depende de props ni estado. */
const ORGANIZATION_JSON_LD = JSON.stringify(buildOrganizationJsonLd());

/** Envoltura del árbol de rutas: activa el tracking de GA4 y el JSON-LD de marca. */
export const RootLayout = () => {
  usePageViews();
  return (
    <>
      <Helmet>
        <script type="application/ld+json">{ORGANIZATION_JSON_LD}</script>
      </Helmet>
      <Outlet />
    </>
  );
};
