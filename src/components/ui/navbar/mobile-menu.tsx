/**
 * @file mobile-menu.tsx
 * @description Menú móvil de navegación pública de Joyería KOB.
 *
 * Se monta desde `Navbar` y se controla con `isOpen`.
 * Incluye accesos rápidos a WhatsApp y Favoritos (placeholder).
 *
 * ## Comportamientos clave
 * - Cuando el panel está abierto, añade `overflow-hidden` al `<body>` para
 *   bloquear el scroll de la página de fondo. Se limpia al cerrar o al
 *   desmontar el componente.
 * - El número de WhatsApp se muestra en una sola línea con `whitespace-nowrap`
 *   para evitar fragmentación en viewports muy estrechos.
 */

import { useEffect } from 'react';
import { Heart, Home, ShoppingBag, User, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from '@/components/ui/social-icons';
import { useAuthStore } from '@/store/auth.store';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

const WHATSAPP_NUMBER = '313 5007459';
const WHATSAPP_URL = 'https://wa.me/573135007459';
const FAVORITES_PATH = '/favoritos';

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/joyeria_kob',
    icon: InstagramIcon,
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@joyeria_kob',
    icon: TikTokIcon,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/187QUCnoFx/',
    icon: FacebookIcon,
  },
] as const;

interface MobileMenuProps {
  /** Si el panel está visible. */
  isOpen: boolean;
  /** Callback para cerrar el panel. */
  onClose: () => void;
  /** Ítems de navegación pública configurados por el navbar. */
  navItems: ReadonlyArray<{ label: string; path: string }>;
  /** Ruta actual para destacar navegación activa. */
  currentPath: string;
}

/**
 * Menú lateral para pantallas móviles y tablets.
 *
 * Bloquea el scroll del documento mientras está abierto añadiendo
 * `overflow-hidden` al `<body>`. El efecto se limpia automáticamente
 * al cerrar el menú o al desmontar el componente.
 *
 * @param props - Estado de apertura, callback de cierre e ítems de navegación.
 * @returns Overlay y panel lateral responsive.
 */
export const MobileMenu = ({
  isOpen,
  onClose,
  navItems,
  currentPath,
}: MobileMenuProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const firstName = user?.name.split(' ')[0] ?? '';

  // ── Bloqueo del scroll de fondo ─────────────────────────────────────────────
  // Añade `overflow-hidden` al <body> mientras el menú está abierto para
  // impedir que la página de fondo se desplace al hacer scroll dentro del panel.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Limpieza: restaura el scroll si el componente se desmonta con el menú abierto.
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuItems = [
    { label: 'Inicio', path: '/', icon: Home },
    ...navItems.map((item) => ({ ...item, icon: ShoppingBag })),
    { label: 'Favoritos', path: FAVORITES_PATH, icon: Heart },
  ];

  return (
    <>
      {/* ── Overlay de fondo ──────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--bg-overlay) 78%, transparent)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel lateral ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-[min(90vw,22.5rem)] flex-col overflow-y-auto border-r transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--bg-topbar)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-secondary)',
          boxShadow: 'var(--shadow-lg)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* ── Cabecera del panel ──────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <Link
            to="/"
            onClick={onClose}
            className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-label="Joyería KOB — Inicio"
          >
            <KobLogo size={82} className="block" />
          </Link>

          <button
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Cerrar menú"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* ── Cuerpo del panel ────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col px-5 py-6">
          {/*
           * Botón de contacto WhatsApp.
           * `whitespace-nowrap` evita que "+57 313 5007459" se fragmente en
           * dos líneas en viewports estrechos (~320px). El layout usa `flex`
           * con `min-w-0` para contener correctamente ícono y texto en una fila.
           */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-3 border px-4 py-3 transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              letterSpacing: 'var(--tracking-wide)',
            }}
            aria-label={`Contactar por WhatsApp al +57 ${WHATSAPP_NUMBER}`}
          >
            {/* Ícono con tamaño fijo para que no se comprima */}
            <WhatsAppIcon size={18} className="shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">+57 {WHATSAPP_NUMBER}</span>
          </a>

          {/* ── Navegación principal ────────────────────────────────────── */}
          <nav className="mt-6 grid gap-1" aria-label="Navegación móvil">
            {menuItems.map(({ label, path, icon: Icon }) => {
              const isActive =
                path === '/'
                  ? currentPath === '/'
                  : currentPath.startsWith(path);

              return (
                <Link
                  key={path}
                  to={path}
                  onClick={onClose}
                  className="grid grid-cols-[1.25rem_1fr] items-center gap-3 border-l px-4 py-3 transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  style={{
                    borderColor: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive
                      ? 'var(--font-semibold)'
                      : 'var(--font-medium)',
                    letterSpacing: 'var(--tracking-wide)',
                    textTransform: 'uppercase',
                  }}
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Sección de autenticación ────────────────────────────────── */}
          <div
            className="mt-6 border-t pt-6"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {isAuthenticated ? (
              <div>
                <p
                  className="px-4 py-2 uppercase"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--text-muted)',
                    opacity: 0.72,
                  }}
                >
                  Hola, {firstName}
                </p>
                <MobileAuthLink to="/perfil" onClose={onClose}>
                  Mi perfil
                </MobileAuthLink>
                {user?.role === 'ADMIN' && (
                  <MobileAuthLink to="/admin/joyas" onClose={onClose}>
                    Panel admin
                  </MobileAuthLink>
                )}
              </div>
            ) : (
              <MobileAuthLink to="/login" onClose={onClose}>
                Iniciar sesión
              </MobileAuthLink>
            )}
          </div>
        </div>

        {/* ── Redes sociales ──────────────────────────────────────────────── */}
        <div
          className="border-t px-5 py-5"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <nav className="flex items-center gap-3" aria-label="Redes sociales">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 cursor-pointer items-center justify-center border transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
                aria-label={label}
              >
                <Icon size={18} aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

interface MobileAuthLinkProps {
  /** Ruta interna del enlace. */
  to: string;
  /** Cierra el menú tras navegar. */
  onClose: () => void;
  /** Etiqueta visible. */
  children: React.ReactNode;
}

/** Enlace de autenticación con estilo común del menú móvil. */
const MobileAuthLink = ({ to, onClose, children }: MobileAuthLinkProps) => (
  <Link
    to={to}
    onClick={onClose}
    className="grid grid-cols-[1.25rem_1fr] items-center gap-3 px-4 py-3 transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    style={{
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      letterSpacing: 'var(--tracking-wide)',
    }}
  >
    <User size={17} aria-hidden="true" />
    {children}
  </Link>
);
