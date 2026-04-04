/**
 * @file main-layout.tsx
 * @description Layout principal con Navbar y Footer.
 * Placeholder temporal
 */

import { Outlet } from 'react-router-dom';

/** Estructura base para rutas públicas. Incluirá Navbar y Footer. */
export const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-kob-gold-50 dark:bg-kob-black">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};