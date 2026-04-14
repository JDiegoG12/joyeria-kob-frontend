/**
 * @file auth-layout.tsx
 * @description Layout ligero para páginas de autenticación.
 * Incluye branding mínimo y toggle de tema sin usar el navbar principal.
 */

import { Link, Outlet } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';

export const AuthLayout = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-4 sm:px-8">
        <Link
          to="/catalogo"
          className="font-serif text-xl tracking-wide text-[var(--text-primary)] transition hover:opacity-80"
        >
          KOB
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 p-2 text-[var(--text-primary)] backdrop-blur-md transition-all hover:scale-105 hover:bg-[var(--bg-tertiary)]"
          aria-label={
            theme === 'light'
              ? 'Activar modo oscuro'
              : 'Activar modo claro'
          }
          aria-pressed={theme === 'dark'}
          title={
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

      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
};