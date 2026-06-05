/**
 * @file mobile-menu.tsx
 * @description Cajón de navegación lateral para móvil y tablet.
 * Se desliza desde la izquierda al pulsar el botón hamburguesa del Navbar.
 *
 * ## Contenido
 * - Logo de la marca
 * - Ítems de navegación principal con indicador de ruta activa
 * - Separador y acceso al perfil o login
 *
 * ## Accesibilidad
 * - Cierra con clic en el overlay oscuro exterior
 * - Cierra con el botón X interno
 * - Trampa de foco pendiente para versión de producción
 *
 * ## Uso
 * Se monta desde `Navbar`, que controla el estado `mobileMenuOpen`.
 * No se usa directamente en ningún otro lugar.
 */

import { Link } from 'react-router-dom';
import { X, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

interface MobileMenuProps {
  /** Si el cajón está visible. */
  isOpen: boolean;
  /** Callback para cerrar el cajón. */
  onClose: () => void;
  /** Ítems de navegación a mostrar. */
  navItems: ReadonlyArray<{ label: string; path: string }>;
  /** Ruta activa actual para destacar el ítem correspondiente. */
  currentPath: string;
}

/**
 * Menú de navegación en cajón lateral para pantallas pequeñas.
 * Se anima con `translate-x` según el estado `isOpen`.
 */
export const MobileMenu = ({
  isOpen,
  onClose,
  navItems,
  currentPath,
}: MobileMenuProps) => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <>
      {/* ── Overlay oscuro ────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 lg:hidden ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        style={{ backgroundColor: 'var(--bg-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Cajón lateral ─────────────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 z-50 flex h-full flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar)',
          boxShadow: 'var(--shadow-xl)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Cabecera del cajón */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <KobLogo />
          <button
            onClick={onClose}
            className="rounded-md p-1.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Ítems de navegación */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map(({ label, path }) => {
            const isActive = currentPath.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className="flex items-center rounded-md px-4 py-3 transition-colors"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-base)',
                  fontWeight: isActive
                    ? 'var(--font-semibold)'
                    : 'var(--font-normal)',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  backgroundColor: isActive
                    ? 'var(--accent-subtle)'
                    : 'transparent',
                  borderLeft: isActive
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Separador */}
        <div
          className="mx-4 h-px"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        {/* Sección de usuario */}
        <div className="p-4">
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              <p
                className="px-4 py-2"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                }}
              >
                Hola, {user?.name.split(' ')[0]}
              </p>
              <Link
                to="/perfil"
                onClick={onClose}
                className="flex items-center gap-3 rounded-md px-4 py-3 transition-colors"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                }}
              >
                <User size={18} />
                Mi perfil
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin/joyas"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-4 py-3 transition-colors"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Panel admin
                </Link>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center gap-3 rounded-md px-4 py-3 transition-colors"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--accent)',
              }}
            >
              <User size={18} />
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </>
  );
};