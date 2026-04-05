/**
 * @file navbar.tsx
 * @description Navbar principal de las rutas públicas de Joyería KOB.
 *
 * ## Contenido
 * - Logo SVG de la marca (izquierda)
 * - Navegación principal: Catálogo, Configurador (centro en desktop)
 * - Acciones: toggle de tema, botón de perfil/login (derecha)
 * - Botón hamburguesa para abrir sidebar de filtros en móvil
 *
 * ## Responsive
 * - Desktop (lg+): navegación horizontal completa
 * - Móvil/Tablet: navegación colapsada en menú hamburguesa (`MobileMenu`)
 *
 * ## Uso
 * Se monta desde `MainLayout`. Recibe `onOpenSidebar` para controlar
 * el cajón de filtros en móvil.
 *
 * ```tsx
 * <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
 * ```
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, User, SlidersHorizontal } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';
import { useAuthStore } from '@/store/auth.store';
import { MobileMenu } from '@/components/ui/navbar/mobile-menu';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

/** Ítems de navegación principal del sitio público. */
const NAV_ITEMS = [
  { label: 'Catálogo',      path: '/catalogo' },
  { label: 'Configurador',  path: '/configurador' },
] as const;

interface NavbarProps {
  /**
   * Callback que abre el cajón de filtros en móvil.
   * Se dispara al pulsar el ícono de filtros en pantallas pequeñas.
   */
  onOpenSidebar: () => void;
}

/**
 * Barra de navegación principal del contexto público.
 * Fija en la parte superior, con z-index sobre el contenido.
 */
export const Navbar = ({ onOpenSidebar }: NavbarProps) => {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 right-0 left-0 z-40"
        style={{
          height: 'var(--navbar-height)',
          backgroundColor: 'var(--bg-topbar)',
          borderBottom: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="mx-auto flex h-full items-center justify-between px-4 lg:px-8"
          style={{ maxWidth: 'var(--content-max-width)' }}
        >

          {/* ── Izquierda: hamburguesa móvil + logo ─────────────────── */}
          <div className="flex items-center gap-3">

            {/* Botón menú hamburguesa — solo móvil */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-md p-2 transition-colors lg:hidden"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link to="/catalogo" aria-label="Inicio Joyería KOB">
              <KobLogo />
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
                  className="relative rounded-md px-4 py-2 transition-colors"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive
                      ? 'var(--font-semibold)'
                      : 'var(--font-normal)',
                    color: isActive
                      ? 'var(--accent)'
                      : 'var(--text-secondary)',
                    backgroundColor: isActive
                      ? 'var(--accent-subtle)'
                      : 'transparent',
                  }}
                >
                  {label}
                  {/* Línea inferior activa */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Derecha: filtros móvil + toggle tema + perfil ────────── */}
          <div className="flex items-center gap-1">

            {/* Botón abrir filtros — solo móvil y solo en /catalogo */}
            {pathname.startsWith('/catalogo') && (
              <button
                onClick={onOpenSidebar}
                className="rounded-md p-2 transition-colors lg:hidden"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Abrir filtros"
              >
                <SlidersHorizontal size={20} />
              </button>
            )}

            {/* Toggle de tema claro/oscuro */}
            <button
              onClick={toggleTheme}
              className="rounded-md p-2 transition-colors"
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
                className="flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
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
        className="flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
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
        <span className="hidden sm:inline">Hola, {firstName}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Cierra al hacer clic fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 z-50 mt-2 w-48 rounded-lg py-1"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <DropdownItem to="/perfil" label="Mi perfil" />
            {role === 'ADMIN' && (
              <DropdownItem to="/admin/joyas" label="Panel admin" />
            )}
            <div
              className="my-1 h-px"
              style={{ backgroundColor: 'var(--border-color)' }}
            />
            <DropdownItem to="/logout" label="Cerrar sesión" danger />
          </div>
        </>
      )}
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
    className="block px-4 py-2 transition-colors"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      color: danger ? 'var(--color-error)' : 'var(--text-secondary)',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor =
        'var(--bg-hover)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
    }}
  >
    {label}
  </Link>
);