/**
 * @file main-layout.tsx
 * @description Layout principal para todas las rutas públicas de Joyería KOB.
 * Estructura la página con Navbar arriba, contenido principal a ancho completo
 * y navegación flotante sobre el fondo atmosférico del catálogo.
 *
 * ## Estructura visual
 * ```
 * ┌─────────────────────────────────────┐
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
 * ## Comportamiento del catálogo
 * - `/catalogo` → navegación de categorías en la página.
 * - cualquier otra ruta → contenido público a ancho completo.
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
import { Navbar } from '@/components/ui/navbar/navbar';
import { Footer } from '@/components/ui/footer/footer';

export const MainLayout = () => {
  return (
    <div
      className="relative flex min-h-screen overflow-hidden flex-col"
      style={{
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: `
          radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 34%),
          radial-gradient(circle at 82% 8%, color-mix(in srgb, var(--bg-tertiary) 84%, transparent), transparent 32%),
          radial-gradient(circle at 72% 72%, color-mix(in srgb, var(--accent-hover) 10%, transparent), transparent 38%),
          linear-gradient(135deg, var(--bg-primary), color-mix(in srgb, var(--bg-secondary) 82%, var(--bg-primary)))`,
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

      <Navbar />

      {/*
        Este div empuja el contenido hacia abajo el alto exacto del navbar.
        El catálogo ya no reserva una columna lateral: respira a ancho completo.
      */}
      <div
        className="relative z-10 flex min-w-0 flex-1"
        style={{ marginTop: 'calc(var(--navbar-height) + 1rem)' }}
      >
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
