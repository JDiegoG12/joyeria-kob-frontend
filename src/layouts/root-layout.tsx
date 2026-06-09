/**
 * @file root-layout.tsx
 * @description Layout raíz del enrutador. No aporta UI: su única función es
 * ejecutar el tracking global de vistas de página (`usePageViews`) en un único
 * punto que cubre TODAS las rutas de la app (públicas, auth, admin y 404).
 *
 * Renderiza `<Outlet />`, de modo que los layouts hijos (MainLayout, AuthLayout,
 * AdminLayout) y sus páginas se montan sin cambios.
 */

import { Outlet } from 'react-router-dom';

import { usePageViews } from '@/hooks/use-page-views';

/** Envoltura transparente del árbol de rutas que activa el tracking de GA4. */
export const RootLayout = () => {
  usePageViews();
  return <Outlet />;
};
