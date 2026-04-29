/**
 * @file navbar.tsx
 * @description Navbar principal de las rutas públicas de Joyería KOB.
 *
 * ## Layout (mockup v3)
 * - Izquierda : hamburguesa (móvil), logo y WhatsApp
 * - Derecha   : perfil, favoritos (placeholder) y toggle de tema
 *
 * El enlace de favoritos apunta a `/favoritos`, ruta placeholder "Próximamente".
 *
 * ## Responsive
 * - Desktop (lg+): barra minimalista con contacto visible
 * - Móvil/Tablet : acciones compactas y menú lateral
 *
 * ## Uso
 * ```tsx
 * // main-layout.tsx
 * <AnnouncementBar />
 * <Navbar />          ← se posiciona fixed debajo del announcement bar
 * ```
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, Moon, Sun, User } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';
import { useAuthStore } from '@/store/auth.store';
import { MobileMenu } from '@/components/ui/navbar/mobile-menu';
import { KobLogo } from '@/components/ui/navbar/kob-logo';
import { WhatsAppIcon } from '@/components/ui/social-icons';

const WHATSAPP_NUMBER = '313 5007459';
const WHATSAPP_URL = 'https://wa.me/573135007459';
const FAVORITES_PATH = '/favoritos';
const ICON_BUTTON_CLASSNAME =
  'flex h-10 w-10 cursor-pointer items-center justify-center transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

/** Ítems de navegación principal. "Catálogo" lleva al catálogo de productos. */
const NAV_ITEMS = [{ label: 'Catálogo', path: '/catalogo' }] as const;

/**
 * Barra de navegación principal del contexto público.
 *
 * Fixed debajo del AnnouncementBar (que tiene `z-50`).
 * Usa `z-40` para quedar por debajo del announcement y por encima del contenido.
 */
export const Navbar = () => {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className="fixed right-0 left-0 z-40 w-full border-b"
        style={{
          top: 'var(--announcement-height)',
          height: 'var(--navbar-height)',
          backgroundColor: 'var(--bg-topbar)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="mx-auto flex h-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10"
          style={{ maxWidth: 'var(--content-max-width)' }}
        >
          {/* ── Izquierda: menú móvil + logo + contacto WhatsApp ───────────────── */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Botón hamburguesa — solo móvil/tablet */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`${ICON_BUTTON_CLASSNAME} lg:hidden`}
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Abrir menú"
            >
              <Menu size={21} aria-hidden="true" />
            </button>

            {/* Logo → lleva a la página principal */}
            <Link
              to="/"
              className="group flex h-12 flex-shrink-0 items-center px-1 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:h-14"
              aria-label="Joyería KOB — Inicio"
            >
              <KobLogo
                size={66}
                className="block h-[64px] w-[64px] sm:h-[70px] sm:w-[70px]"
              />
            </Link>

            <div
              className="hidden h-8 w-px sm:block"
              style={{ backgroundColor: 'var(--border-color)' }}
              aria-hidden="true"
            />

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-w-0 items-center gap-2 rounded-sm px-2 py-1 transition-opacity duration-200 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:flex"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-medium)',
                letterSpacing: 'var(--tracking-normal)',
              }}
              aria-label={`Contactar por WhatsApp al +57 ${WHATSAPP_NUMBER}`}
            >
              <WhatsAppIcon size={21} aria-hidden="true" />
              <span className="truncate">+57 {WHATSAPP_NUMBER}</span>
            </a>
          </div>

          {/* ── Derecha: perfil + favoritos + toggle tema ─────────────────────── */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {isAuthenticated ? (
              <UserMenu name={user?.name ?? ''} role={user?.role ?? 'CLIENT'} />
            ) : (
              <Link
                to="/login"
                className={ICON_BUTTON_CLASSNAME}
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Ir a iniciar sesión"
              >
                <User size={21} aria-hidden="true" />
              </Link>
            )}

            <Link
              to={FAVORITES_PATH}
              className={ICON_BUTTON_CLASSNAME}
              style={{
                color: pathname.startsWith(FAVORITES_PATH)
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
              }}
              aria-label="Ir a favoritos (próximamente)"
            >
              <Heart size={21} aria-hidden="true" />
            </Link>

            {/* Toggle de tema claro/oscuro */}
            <button
              onClick={toggleTheme}
              className={ICON_BUTTON_CLASSNAME}
              style={{ color: 'var(--text-secondary)' }}
              aria-label={
                theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'
              }
            >
              {theme === 'light' ? (
                <Moon size={21} aria-hidden="true" />
              ) : (
                <Sun size={21} aria-hidden="true" />
              )}
            </button>
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
  /** Nombre completo del usuario. Solo se muestra el primer nombre. */
  name: string;
  /** Rol para mostrar acceso al panel admin si corresponde. */
  role: string;
}

/**
 * Botón de perfil con dropdown para usuarios autenticados.
 * Mantiene una entrada compacta para respetar el diseño minimal del mockup.
 */
const UserMenu = ({ name, role }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const firstName = name.trim().split(' ')[0] || 'usuario';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={ICON_BUTTON_CLASSNAME}
        style={{
          color: 'var(--text-secondary)',
          backgroundColor: open ? 'var(--bg-hover)' : 'transparent',
        }}
        aria-label={`Abrir menú de ${firstName}`}
        aria-expanded={open}
      >
        <User size={21} aria-hidden="true" />
      </button>

      {/* Backdrop para cerrar el dropdown */}
      <div
        className={`fixed inset-0 z-40 ${open ? 'block' : 'hidden'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Dropdown */}
      <div
        className={`absolute right-0 z-50 mt-2 w-56 max-w-[calc(100vw-1rem)] origin-top-right border py-2 shadow-[var(--shadow-lg)] transition-[opacity,transform] duration-200 ease-out ${
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
        role="menu"
      >
        <p
          className="px-4 pt-1 pb-2"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--tracking-wide)',
            color: 'var(--text-muted)',
          }}
        >
          Hola, {firstName}
        </p>
        <DropdownItem to="/perfil" label="Mi perfil" />
        {role === 'ADMIN' && (
          <DropdownItem to="/admin/joyas" label="Panel admin" />
        )}
        <div
          className="my-2 h-px"
          style={{ backgroundColor: 'var(--border-color)' }}
        />
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

/** Ítem individual del dropdown de usuario. */
const DropdownItem = ({ to, label, danger = false }: DropdownItemProps) => (
  <Link
    to={to}
    role="menuitem"
    className="block px-4 py-2.5 transition-colors duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: danger ? 'var(--font-medium)' : 'var(--font-semibold)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: danger
        ? 'color-mix(in srgb, var(--color-error) 70%, var(--text-secondary))'
        : 'var(--text-secondary)',
    }}
  >
    {label}
  </Link>
);
