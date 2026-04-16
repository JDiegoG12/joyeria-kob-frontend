/**
 * @file navbar.tsx
 * @description Navbar principal de las rutas públicas de Joyería KOB.
 *
 * ## Contenido
 * - Logo SVG de la marca (izquierda)
 * - Navegación principal: Catálogo, Configurador (centro en desktop)
 * - Acciones: toggle de tema, botón de perfil/login (derecha)
 * - Botón hamburguesa para abrir la navegación móvil
 *
 * ## Responsive
 * - Desktop (lg+): navegación horizontal completa
 * - Móvil/Tablet: navegación colapsada en menú hamburguesa (`MobileMenu`)
 *
 * ## Uso
 * Se monta desde `MainLayout` como navegación pública flotante.
 *
 * ```tsx
 * <Navbar />
 * ```
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, User } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';
import { useAuthStore } from '@/store/auth.store';
import { MobileMenu } from '@/components/ui/navbar/mobile-menu';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

/** Ítems de navegación principal del sitio público. */
const NAV_ITEMS = [
  { label: 'Catálogo', path: '/catalogo' },
  { label: 'Configurador', path: '/configurador' },
] as const;

/**
 * Barra de navegación principal del contexto público.
 * Fija en la parte superior, con z-index sobre el contenido.
 */
export const Navbar = () => {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-4 right-4 left-4 z-40 rounded-md border border-white/10 backdrop-blur-2xl"
        style={{
          height: 'var(--navbar-height)',
          backgroundColor:
            'color-mix(in srgb, var(--bg-topbar) 48%, transparent)',
          boxShadow: '0 24px 90px rgba(0, 0, 0, 0.14)',
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
        }}
      >
        <div
          className="mx-auto flex h-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
          style={{ maxWidth: 'var(--content-max-width)' }}
        >
          {/* ── Izquierda: hamburguesa móvil + logo ─────────────────── */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* Botón menú hamburguesa — solo móvil */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:hidden"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            {/* Logo */}
            <Link
              to="/catalogo"
              className="group flex h-14 flex-shrink-0 items-center justify-center rounded-md px-2 transition-transform duration-200 ease-out hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:scale-100 sm:h-16 sm:px-3"
              style={{
                filter:
                  theme === 'dark'
                    ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.24))'
                    : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))',
              }}
              aria-label="Inicio Joyería KOB"
            >
              <KobLogo
                size={88}
                className="block transition-[filter] duration-200 group-hover:brightness-110 sm:h-[92px] sm:w-[92px]"
              />
            </Link>
          </div>

          {/* ── Centro: navegación principal — solo desktop ──────────── */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(({ label, path }) => {
              const isActive = pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className="relative rounded-md px-4 py-2 transition-opacity duration-300 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: isActive
                      ? 'var(--font-semibold)'
                      : 'var(--font-medium)',
                    letterSpacing: 'var(--tracking-widest)',
                    textTransform: 'uppercase',
                    color: isActive
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {label}
                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-0.5 h-1 w-1 -translate-x-1/2 rounded-full"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Derecha: filtros móvil + toggle tema + perfil ────────── */}
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Toggle de tema claro/oscuro */}
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{ color: 'var(--text-secondary)' }}
              aria-label={
                theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'
              }
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Perfil o botón de login */}
            {isAuthenticated ? (
              <UserMenu name={user?.name ?? ''} role={user?.role ?? 'CLIENT'} />
            ) : (
              <Link
                to="/login"
                className="flex h-10 items-center gap-2 rounded-md px-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-secondary)',
                }}
              >
                <User size={18} />
                <span className="hidden sm:inline">Iniciar sesión</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Menú móvil — cajón lateral */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={NAV_ITEMS}
        currentPath={pathname}
      />
    </>
  );
};

// ─── Subcomponente: menú de usuario autenticado ───────────────────────────────

interface UserMenuProps {
  /** Nombre del usuario para mostrar como saludo. */
  name: string;
  /** Rol para redirigir al panel admin si corresponde. */
  role: string;
}

/**
 * Botón de perfil con saludo al usuario autenticado.
 * Si el rol es ADMIN, muestra también acceso rápido al panel.
 *
 * @internal Solo se usa dentro de `Navbar`.
 */
const UserMenu = ({ name, role }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const firstName = name.split(' ')[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          color: 'var(--text-primary)',
          backgroundColor: open ? 'var(--bg-hover)' : 'transparent',
        }}
        aria-label="Menú de usuario"
      >
        {/* Avatar inicial */}
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            fontWeight: 'var(--font-bold)',
          }}
        >
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">
          Hola, {firstName}
        </span>
      </button>

      {/* Dropdown */}
      <div
        className={`fixed inset-0 z-40 ${open ? 'block' : 'hidden'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`absolute right-0 z-50 mt-3 w-56 max-w-[calc(100vw-1rem)] origin-top-right rounded-md border border-black/5 py-2 backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out dark:border-white/5 ${
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-secondary) 68%, transparent)',
          boxShadow: '0 28px 90px rgba(0, 0, 0, 0.16)',
          backdropFilter: 'blur(24px) saturate(170%)',
          WebkitBackdropFilter: 'blur(24px) saturate(170%)',
        }}
      >
        <DropdownItem to="/perfil" label="Mi perfil" />
        {role === 'ADMIN' && (
          <DropdownItem to="/admin/joyas" label="Panel admin" />
        )}
        <div className="my-2 h-px bg-black/5 dark:bg-white/5" />
        <DropdownItem to="/logout" label="Cerrar sesión" danger />
      </div>
    </div>
  );
};

// ─── Subcomponente: ítem de dropdown ─────────────────────────────────────────

interface DropdownItemProps {
  to: string;
  label: string;
  danger?: boolean;
}

/**
 * Ítem individual del dropdown de usuario.
 * @internal Solo se usa dentro de `UserMenu`.
 */
const DropdownItem = ({ to, label, danger = false }: DropdownItemProps) => (
  <Link
    to={to}
    className="block px-4 py-2.5 transition-[background-color,color,opacity] duration-300 hover:bg-[var(--bg-hover)] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: danger ? 'var(--font-medium)' : 'var(--font-semibold)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: danger
        ? 'color-mix(in srgb, var(--color-error) 64%, var(--text-secondary))'
        : 'var(--text-secondary)',
    }}
  >
    {label}
  </Link>
);
