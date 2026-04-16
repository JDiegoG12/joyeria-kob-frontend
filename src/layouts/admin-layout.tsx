/**
 * @file admin-layout.tsx
 * @description Layout exclusivo del panel de administración de Joyería KOB.
 *
 * ## Comportamiento del margen del contenido
 * El sidebar es `position: fixed`, por lo que no ocupa espacio en el flujo
 * del documento. El `<main>` necesita un `marginLeft` igual al ancho del
 * sidebar para que el contenido no quede debajo de él.
 *
 * Este margen solo aplica en desktop (≥ 1024px). En mobile el sidebar
 * es un cajón flotante que no desplaza el contenido, por lo que aplicar
 * el margen en mobile empuja todo hacia la derecha incorrectamente.
 *
 * La detección del breakpoint se hace con `window.matchMedia` dentro de
 * un hook `useIsDesktop` que actualiza el estado al redimensionar.
 */

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminTopbar } from '@/components/ui/topbar/admin-topbar';
import { AdminSidebar } from '@/components/ui/sidebar/admin-sidebar';

// ─── Hook: detecta si la pantalla es desktop (lg = 1024px) ───────────────────

/**
 * Devuelve `true` si el viewport es ≥ 1024px (breakpoint `lg` de Tailwind).
 * Se actualiza reactivamente al redimensionar la ventana.
 */
const useIsDesktop = (): boolean => {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop;
};

// ─── Layout ───────────────────────────────────────────────────────────────────

/**
 * Layout raíz del panel de administración.
 * Gestiona el estado de colapso y apertura móvil del sidebar admin.
 */
export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useIsDesktop();

  /**
   * El margen izquierdo del contenido solo aplica en desktop,
   * donde el sidebar es siempre visible y fijo.
   * En mobile es 0 porque el sidebar flota sobre el contenido.
   */
  const contentMarginLeft = isDesktop
    ? collapsed
      ? 'var(--sidebar-width-collapsed)'
      : 'var(--sidebar-width)'
    : 0;

  return (
    <div
      className="flex min-h-screen min-w-0 flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-md focus:px-4 focus:py-2"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-text)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
        }}
      >
        Saltar al contenido
      </a>

      {/* ── Topbar admin ──────────────────────────────────────────── */}
      <AdminTopbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isSidebarOpen={sidebarOpen}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        isCollapsed={collapsed}
        sidebarOffset={contentMarginLeft}
      />

      {/* ── Área central: sidebar + contenido ────────────────────── */}
      <div
        className="flex flex-1"
        style={{ paddingTop: 'var(--topbar-height)' }}
      >
        <AdminSidebar
          isOpen={sidebarOpen}
          isCollapsed={collapsed}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Contenido del panel actual */}
        <main
          id="admin-content"
          className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 transition-all duration-300 ease-in-out sm:p-6 lg:p-8"
          style={{
            marginLeft: contentMarginLeft,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
