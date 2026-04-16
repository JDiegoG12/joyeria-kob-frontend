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
      {/* ── Overlay translúcido ───────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-overlay) 62%, transparent)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel  ─────────────────────────────────────────── */}
      <div
        className={`fixed top-4 bottom-4 left-4 z-50 flex w-[calc(100vw-2rem)] origin-top-left flex-col overflow-x-hidden overflow-y-auto rounded-md border border-black/5 backdrop-blur-2xl transition-[opacity,transform] duration-300 ease-out dark:border-white/5 sm:w-[min(86vw,var(--sidebar-width))] lg:hidden ${
          isOpen
            ? 'pointer-events-auto translate-x-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-x-4 scale-95 opacity-0'
        }`}
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-sidebar) 62%, transparent)',
          boxShadow: '0 34px 120px rgba(0, 0, 0, 0.22)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Cabecera del cajón */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-5 dark:border-white/5">
          <KobLogo size={88} className="block" />
          <button
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Ítems de navegación */}
        <nav className="flex flex-col gap-2 p-5">
          <p
            className="px-4 pb-2"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            Joyería KOB
          </p>
          {navItems.map(({ label, path }) => {
            const isActive = currentPath.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className="relative flex items-center rounded-md px-4 py-3 transition-opacity duration-300 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
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
                <span
                  className={`absolute top-3 bottom-3 left-0 w-px transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ backgroundColor: 'var(--accent)' }}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Separador */}
        <div className="mx-5 h-px bg-black/5 dark:bg-white/5" />

        {/* Sección de usuario */}
        <div className="p-5">
          {isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <p
                className="px-4 py-2 uppercase"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: 'var(--tracking-widest)',
                  color: 'var(--text-muted)',
                }}
              >
                Hola, {user?.name.split(' ')[0]}
              </p>
              <Link
                to="/perfil"
                onClick={onClose}
                className="flex items-center gap-3 rounded-md px-4 py-3 transition-opacity duration-300 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
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
                  className="flex items-center gap-3 rounded-md px-4 py-3 transition-opacity duration-300 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    letterSpacing: 'var(--tracking-wide)',
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
              className="flex items-center gap-3 rounded-md px-4 py-3 transition-opacity duration-300 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                letterSpacing: 'var(--tracking-wide)',
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
