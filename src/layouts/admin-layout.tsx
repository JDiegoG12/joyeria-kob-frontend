/**
 * @file admin-layout.tsx
 * @description Layout del panel de administración con sidebar.
 * Placeholder temporal
 */

import { Outlet } from 'react-router-dom';

/** Estructura base para rutas protegidas de administración. */
export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-kob-gold-50 dark:bg-kob-black">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};