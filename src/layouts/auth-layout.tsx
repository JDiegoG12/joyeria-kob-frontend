/**
 * @file auth-layout.tsx
 * @description Layout para páginas de autenticación.
 * Header con los mismos tokens que el navbar principal.
 */

import { Link, Outlet } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

export const AuthLayout = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* Header — mismos tokens que el navbar principal */}
      <header
        className="sticky top-0 z-30 w-full border-b"
        style={{
          backgroundColor: 'var(--bg-topbar)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="mx-auto flex h-[var(--navbar-height,64px)] items-center justify-between px-4 sm:px-6 lg:px-10">

          {/* Logo KOB */}
          <Link
            to="/catalogo"
            className="flex items-center transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-label="Joyería KOB — Inicio"
          >
            <KobLogo size={66} className="block h-[64px] w-[64px] sm:h-[70px] sm:w-[70px]" />
          </Link>

          {/* Toggle tema */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 cursor-pointer items-center justify-center transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={
              theme === 'light'
                ? 'Activar modo oscuro'
                : 'Activar modo claro'
            }
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};
