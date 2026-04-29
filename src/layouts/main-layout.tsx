/**
 * @file main-layout.tsx
 * @description Layout principal para todas las rutas públicas de Joyería KOB.
 * Estructura la página con AnnouncementBar y Navbar fijos, contenido principal
 * a ancho completo y footer.
 *
 * ## Estructura visual
 * ```
 * ┌─────────────────────────────────────┐
 * │        ANNOUNCEMENT BAR             │
 * ├─────────────────────────────────────┤
 * │            NAVBAR                   │
 * ├──────────────┬──────────────────────┤
 * │              │                      │
 * │                                     │
 * │           <Outlet />                │
 * │       (página actual)               │
 * │                                     │
 * ├──────────────┴──────────────────────┤
 * │            FOOTER                   │
 * └─────────────────────────────────────┘
 * ```
 *
 * ## Comportamiento de rutas públicas
 * - `/` → página principal de marca.
 * - `/catalogo` → catálogo público con filtros y productos.
 *
 * ## Responsive
 * - Desktop: catálogo centrado con max-width elegante.
 * - Móvil/Tablet: contenido fluido con navegación horizontal desplazable.
 *
 * ## Uso
 * Se monta automáticamente desde el router. No necesita props.
 * ```tsx
 * // router/index.tsx
 * { element: <MainLayout />, children: [...] }
 * ```
 */
import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from '@/components/announcement-bar/announcement-bar';
import { Navbar } from '@/components/ui/navbar/navbar';
import { Footer } from '@/components/ui/footer/footer';

export const MainLayout = () => {
  return (
    <div
      className="relative flex min-h-screen overflow-hidden flex-col"
      style={{
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: `
          linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 38%, var(--bg-primary) 100%)`,
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] mix-blend-multiply dark:opacity-[0.08] dark:mix-blend-screen"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--text-primary) 1px, transparent 0)',
          backgroundSize: '14px 14px',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70 dark:opacity-80"
        style={{
          backgroundImage:
            'linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--bg-primary) 78%, transparent) 76%, var(--bg-primary) 100%)',
        }}
        aria-hidden="true"
      />

      <AnnouncementBar />
      <Navbar />
      <div
        className="relative z-10 flex-shrink-0"
        style={{
          height: 'calc(var(--announcement-height) + var(--navbar-height))',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-w-0 flex-1">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};
