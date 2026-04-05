/**
 * @file admin-layout.tsx
 * @description Layout exclusivo del panel de administración de Joyería KOB.
 * Estructura la interfaz con un topbar fijo arriba y un sidebar de navegación
 * administrativa a la izquierda.
 *
 * ## Estructura visual
 * ```
 * ┌─────────────────────────────────────┐
 * │            TOPBAR ADMIN             │
 * ├──────────────┬──────────────────────┤
 * │              │                      │
 * │   SIDEBAR    │     <Outlet />       │
 * │    ADMIN     │   (panel actual)     │
 * │              │                      │
 * │              │                      │
 * └──────────────┴──────────────────────┘
 * ```
 *
 * ## Comportamiento del sidebar admin
 * - Desktop: siempre visible, puede colapsarse a solo íconos
 * - Tablet: colapsado por defecto (solo íconos)
 * - Móvil: cajón deslizable controlado por `sidebarOpen`
 *
 * ## Sin footer
 * El panel admin no tiene footer público. Si se necesita en el futuro,
 * agregar un `<AdminFooter />` al final del layout.
 *
 * ## Uso
 * Se monta automáticamente desde el router dentro de `ProtectedRoute`.
 * ```tsx
 * // router/index.tsx
 * {
 *   element: (
 *     <ProtectedRoute requiredRole="ADMIN">
 *       <AdminLayout />
 *     </ProtectedRoute>
 *   ),
 *   children: [...]
 * }
 * ```
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminTopbar } from '@/components/ui/topbar/admin-topbar';
import { AdminSidebar } from '@/components/ui/sidebar/admin-sidebar';

/**
 * Layout raíz del panel de administración.
 * Gestiona el estado de colapso y apertura móvil del sidebar admin.
 */
export const AdminLayout = () => {
  /** Controla si el sidebar está colapsado en desktop (solo íconos). */
  const [collapsed, setCollapsed] = useState(false);
  /** Controla si el cajón del sidebar está abierto en móvil. */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── Topbar admin ──────────────────────────────────────────── */}
      <AdminTopbar
        onOpenSidebar={() => setSidebarOpen(true)}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        isCollapsed={collapsed}
      />

      {/* ── Área central: sidebar + contenido ────────────────────── */}
      <div
        className="flex flex-1"
        style={{ paddingTop: 'var(--topbar-height)' }}
      >
        {/* Sidebar de navegación administrativa */}
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
            marginLeft: collapsed
              ? 'var(--sidebar-width-collapsed)'
              : 'var(--sidebar-width)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
