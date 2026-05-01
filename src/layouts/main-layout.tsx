/**
 * @file main-layout.tsx
 * @description Layout principal para todas las rutas públicas de Joyería KOB.
 * Estructura la página con AnnouncementBar y Navbar fijos, contenido principal
 * a ancho completo y footer.
 *
 * ## Estructura visual
 * ┌─────────────────────────────────────┐
 * │        ANNOUNCEMENT BAR             │
 * ├─────────────────────────────────────┤
 * │            NAVBAR                   │
 * ├──────────────┬──────────────────────┤
 * │                                     │
 * │           <Outlet />                │
 * │       (página actual)               │
 * │                                     │
 * ├──────────────┴──────────────────────┤
 * │            FOOTER                   │
 * └─────────────────────────────────────┘
 */

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { AnnouncementBar } from '@/components/announcement-bar/announcement-bar';
import { Navbar } from '@/components/ui/navbar/navbar';
import { Footer } from '@/components/ui/footer/footer';

import { AuthService } from '@/features/auth/services/auth.service';

export const MainLayout = () => {
  // ─────────────────────────────────────────────
  // Verifica automáticamente si el token sigue
  // siendo válido cuando se monta el layout.
  //
  // Si el token expiró o es inválido:
  // → limpia sesión
  // → redirige a /login
  // ─────────────────────────────────────────────
  useEffect(() => {
    AuthService.isAuthenticated();
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: `
          linear-gradient(
            180deg,
            var(--bg-secondary) 0%,
            var(--bg-primary) 38%,
            var(--bg-primary) 100%
          )
        `,
      }}
    >
      {/* ── Textura de fondo ───────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06] mix-blend-multiply dark:opacity-[0.08] dark:mix-blend-screen"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--text-primary) 1px, transparent 0)',
          backgroundSize: '14px 14px',
        }}
        aria-hidden="true"
      />

      {/* ── Overlay degradado ─────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70 dark:opacity-80"
        style={{
          backgroundImage:
            'linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--bg-primary) 78%, transparent) 76%, var(--bg-primary) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Header público ────────────────────────────── */}
      <AnnouncementBar />
      <Navbar />

      {/* Spacer para navbar fixed */}
      <div
        className="relative z-10 flex-shrink-0"
        style={{
          height: 'calc(var(--announcement-height) + var(--navbar-height))',
        }}
        aria-hidden="true"
      />

      {/* ── Contenido principal ───────────────────────── */}
      <div className="relative z-10 flex min-w-0 flex-1">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};