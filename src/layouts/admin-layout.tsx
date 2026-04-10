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
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── Topbar admin ──────────────────────────────────────────── */}
      <AdminTopbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isSidebarOpen={sidebarOpen}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        isCollapsed={collapsed}
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
          className="flex-1 overflow-auto transition-all duration-300"
          style={{
            padding: '2rem',
            marginLeft: contentMarginLeft,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
