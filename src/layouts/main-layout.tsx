/**
 * @file main-layout.tsx
 * @description Layout principal para todas las rutas públicas de Joyería KOB.
 * Estructura la página con Navbar arriba, sidebar de filtros a la izquierda
 * (solo en /catalogo), contenido principal y footer abajo.
 *
 * ## Estructura visual
 * ```
 * ┌─────────────────────────────────────┐
 * │            NAVBAR                   │
 * ├──────────────┬──────────────────────┤
 * │              │                      │
 * │   SIDEBAR    │     <Outlet />       │
 * │  (solo en    │   (página actual)    │
 * │  /catalogo)  │                      │
 * │              │                      │
 * ├──────────────┴──────────────────────┤
 * │            FOOTER                   │
 * └─────────────────────────────────────┘
 * ```
 *
 * ## Comportamiento del sidebar
 * - `/catalogo` → sidebar de filtros visible
 * - cualquier otra ruta → sin sidebar, contenido a ancho completo
 *
 * ## Responsive
 * - Desktop: sidebar fijo a la izquierda
 * - Móvil/Tablet: sidebar como cajón deslizable controlado por `sidebarOpen`
 *
 * ## Uso
 * Se monta automáticamente desde el router. No necesita props.
 * ```tsx
 * // router/index.tsx
 * { element: <MainLayout />, children: [...] }
 * ```
 */
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/ui/navbar/navbar';
import { FilterSidebar } from '@/components/ui/sidebar/filter-sidebar';
import { Footer } from '@/components/ui/footer/footer';

const ROUTES_WITH_SIDEBAR = ['/catalogo'];

export const MainLayout = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showSidebar = ROUTES_WITH_SIDEBAR.includes(pathname);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

      {/*
        Este div empuja todo el contenido hacia abajo el alto exacto
        del navbar. El sidebar y el main viven dentro de aquí,
        así que el sidebar nunca tapa el navbar.
      */}
      <div
        className="flex flex-1"
        style={{ marginTop: 'var(--navbar-height)' }}
      >
        {showSidebar && (
          <FilterSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main
          className={`flex-1 ${showSidebar ? 'main-content-with-sidebar' : ''} main-content`}
        >
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};
