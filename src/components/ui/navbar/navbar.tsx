/**
 * @file navbar.tsx
 * @description Navbar principal de las rutas públicas de Joyería KOB.
 *
 * ## Layout (mockup v3)
 * - Izquierda : hamburguesa (móvil), logo y WhatsApp
 * - Derecha   : perfil, favoritos y toggle de tema
 *
 * ## IMPORTANTE
 * El logout NO usa navegación (`/logout`) porque cerrar sesión
 * es una acción, no una página. Se ejecuta mediante
 * `AuthService.logout()`.
 *
 * ## Responsive
 * - Desktop (lg+): barra minimalista con contacto visible
 * - Móvil/Tablet : acciones compactas y menú lateral
 */

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Menu, Moon, Sun, User } from 'lucide-react';

import { useThemeStore } from '@/store/theme.store';
import { useAuthStore } from '@/store/auth.store';

import { AuthService } from '@/features/auth/services/auth.service';

import {
  FavoriteCounterBadge,
  useFavoriteStore,
} from '@/features/favorites';

import { MobileMenu } from '@/components/ui/navbar/mobile-menu';
import { KobLogo } from '@/components/ui/navbar/kob-logo';
import { WhatsAppIcon } from '@/components/ui/social-icons';
import { WHATSAPP_URL, PHONE_DISPLAY } from '@/config/contact';

const FAVORITES_PATH = '/favoritos';

const ICON_BUTTON_CLASSNAME =
  'flex h-10 w-10 cursor-pointer items-center justify-center transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

/** Ítems de navegación principal */
const NAV_ITEMS = [
  {
    label: 'Catálogo',
    path: '/catalogo',
  },
] as const;

/**
 * Navbar principal del sitio público.
 */
export const Navbar = () => {
  const { pathname } = useLocation();

  const { theme, toggleTheme } = useThemeStore();

  const { isAuthenticated, user } = useAuthStore();

  /**
   * Favoritos
   */
  const loadFavorites = useFavoriteStore(
    (state) => state.loadFavorites,
  );

  const favoriteCount = useFavoriteStore(
    (state) => state.favorites.length,
  );

  useEffect(() => {
    if (isAuthenticated) {
      void loadFavorites();
    }
  }, [isAuthenticated, loadFavorites]);

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
          style={{
            maxWidth: 'var(--content-max-width)',
          }}
        >
          {/* ───────────────────────────────────────────── */}
          {/* IZQUIERDA */}
          {/* ───────────────────────────────────────────── */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Menú móvil */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`${ICON_BUTTON_CLASSNAME} lg:hidden`}
              style={{
                color: 'var(--text-secondary)',
              }}
              aria-label="Abrir menú"
            >
              <Menu size={21} aria-hidden="true" />
            </button>

            {/* Logo — glifo de marca */}
            <Link
              to="/"
              className="group flex flex-shrink-0 items-center px-1 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label="Joyería KOB — Inicio"
            >
              {/*
               * Glifo con `viewBox` recortado al área real del monograma:
               * el cuadro completo (0 0 375 375) deja ~63% de margen vertical
               * transparente, lo que hacía verse diminuto el dibujo. Recortando
               * a la zona del monograma, este llena su caja y se ve grande
               * dentro de la barra compacta sin desbordarla.
               *
               * Dimensionado por altura (`w-auto`): el ancho se deriva de la
               * proporción del viewBox recortado, evitando distorsión.
               */}
              <KobLogo
                size={64}
                viewBox="50 120 275 170"
                className="block h-11 w-auto sm:h-12 lg:h-10"
              />
            </Link>

            <div
              className="hidden h-8 w-px sm:block"
              style={{
                backgroundColor: 'var(--border-color)',
              }}
              aria-hidden="true"
            />

            {/* WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-w-0 items-center gap-2 rounded-sm px-2 py-1 transition-opacity duration-200 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:flex"
              style={{
                /*
                 * Tipografía alineada con la barra de catálogo (`NavBarEdgeButton`):
                 * font-ui, text-xs, uppercase, tracking-widest, medium y color
                 * de acento. Evita el contraste tipográfico que rompía la
                 * estética entre el navbar y la barra inferior.
                 */
                color: 'var(--text-accent)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                letterSpacing: 'var(--tracking-widest)',
                textTransform: 'uppercase',
              }}
              aria-label={`Contáctanos por WhatsApp al ${PHONE_DISPLAY}`}
            >
              <WhatsAppIcon size={18} aria-hidden="true" />

              {/*
               * CTA amigable en lugar del número completo (más limpio y menos
               * engorroso). El enlace sigue apuntando a `wa.me`; el número se
               * conserva en el `aria-label` para lectores de pantalla.
               */}
              <span className="truncate">Contáctanos</span>
            </a>
          </div>

          {/* ───────────────────────────────────────────── */}
          {/* DERECHA */}
          {/* ───────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {/* Usuario autenticado */}
            {isAuthenticated ? (
              <UserMenu
                name={user?.name ?? ''}
                role={user?.role ?? 'CLIENT'}
              />
            ) : (
              <Link
                to="/login"
                className={ICON_BUTTON_CLASSNAME}
                style={{
                  color: 'var(--text-secondary)',
                }}
                aria-label="Ir a iniciar sesión"
              >
                <User size={21} aria-hidden="true" />
              </Link>
            )}

            {/* Favoritos */}
            <Link
              to={FAVORITES_PATH}
              className={`${ICON_BUTTON_CLASSNAME} relative`}
              style={{
                color: pathname.startsWith(FAVORITES_PATH)
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
              }}
              aria-label={`Ir a favoritos${
                favoriteCount > 0 ? ` (${favoriteCount})` : ''
              }`}
            >
              <Heart size={21} aria-hidden="true" />

              <FavoriteCounterBadge />
            </Link>

            {/* Tema */}
            <button
              onClick={toggleTheme}
              className={ICON_BUTTON_CLASSNAME}
              style={{
                color: 'var(--text-secondary)',
              }}
              aria-label={
                theme === 'light'
                  ? 'Activar modo oscuro'
                  : 'Activar modo claro'
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

      {/* Menú móvil */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={NAV_ITEMS}
        currentPath={pathname}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// USER MENU
// ─────────────────────────────────────────────────────────────

interface UserMenuProps {
  name: string;
  role: string;
}

/**
 * Menú dropdown del usuario autenticado.
 */
const UserMenu = ({ name, role }: UserMenuProps) => {
  const [open, setOpen] = useState(false);

  const firstName = name.trim().split(' ')[0] || 'usuario';
  // Inicial del nombre para el avatar, igual que el topbar del panel admin.
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      {/* Botón perfil */}
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
        {/*
         * Avatar con la inicial del usuario autenticado (móvil y PC), en
         * lugar del ícono genérico de persona. Mismo patrón visual que el
         * avatar del topbar admin para mantener coherencia.
         */}
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-bold)',
          }}
          aria-hidden="true"
        >
          {initial}
        </span>
      </button>

      {/* Backdrop */}
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
        {/* Saludo */}
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

        {/* Perfil */}
        <DropdownItem to="/perfil" label="Mi perfil" />

        {/* Admin */}
        {role === 'ADMIN' && (
          <DropdownItem
            to="/admin/general"
            label="Panel admin"
          />
        )}

        <div
          className="my-2 h-px"
          style={{
            backgroundColor: 'var(--border-color)',
          }}
        />

        {/* Logout */}
        <button
          onClick={() => AuthService.logout()}
          role="menuitem"
          className="block w-full px-4 py-2.5 text-left transition-colors duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-medium)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
            color:
              'color-mix(in srgb, var(--color-error) 70%, var(--text-secondary))',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DROPDOWN ITEM
// ─────────────────────────────────────────────────────────────

interface DropdownItemProps {
  to: string;
  label: string;
  danger?: boolean;
}

/**
 * Ítem normal de navegación del dropdown.
 */
const DropdownItem = ({
  to,
  label,
  danger = false,
}: DropdownItemProps) => (
  <Link
    to={to}
    role="menuitem"
    className="block px-4 py-2.5 transition-colors duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      fontWeight: danger
        ? 'var(--font-medium)'
        : 'var(--font-semibold)',
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