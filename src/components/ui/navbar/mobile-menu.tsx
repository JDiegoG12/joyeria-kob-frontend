/**
 * @file mobile-menu.tsx
 * @description Menú móvil de navegación pública de Joyería KOB.
 *
 * ─── Animación de entrada (premium) ───────────────────────────────────────────
 * Migrado de transiciones CSS a Framer Motion para conseguir una entrada más
 * sofisticada, en línea con la estética luxury del resto del sitio:
 *
 * · Overlay  : fade suave con `backdrop-blur` para desfocalizar el contenido
 *              de fondo, dando sensación de profundidad.
 * · Panel    : slide horizontal desde la izquierda con easing tipo `spring`
 *              suave (cubic-bezier premium [0.22, 1, 0.36, 1]).
 * · Cabecera : entra con un fade + leve translateY, ligeramente desfasada
 *              del panel para crear capas de profundidad.
 * · Ítems    : stagger escalonado — cada link aparece con un pequeño delay
 *              acumulativo, generando una cascada elegante.
 * · Sociales : última capa, entra al final con un fade.
 *
 * Todo se respeta cuando `prefers-reduced-motion` está activo: las distancias
 * y duraciones se reducen al mínimo perceptible.
 *
 * ─── Comportamiento clave ────────────────────────────────────────────────────
 * - Bloquea el scroll del `<body>` mientras el panel está abierto.
 * - Cierre por click en overlay, por la ✕, por seleccionar un ítem o por Esc.
 * - El número de WhatsApp se mantiene en una sola línea con `whitespace-nowrap`.
 *
 * ─── Ítem "Servicios" (especial) ─────────────────────────────────────────────
 * No es una ruta — es un anchor (`#servicios`) dentro de la home.
 * - Si el usuario está en `/`     → scroll suave directo a la sección.
 * - Si está en otra ruta          → navega a `/` pasando `state.scrollTo` para
 *                                   que `HomePage` haga el scroll tras montar.
 *
 * El offset del scroll compensa anuncio + navbar (sin la barra de catálogo,
 * que está oculta en móvil) + un margen visual de 16px.
 */

import { useEffect } from 'react';
import { Heart, Home, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from '@/components/ui/social-icons';
import { useAuthStore } from '@/store/auth.store';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

// ─── Constantes ──────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '313 5007459';
const WHATSAPP_URL = 'https://wa.me/573135007459';
const FAVORITES_PATH = '/favoritos';

/** Anchor de la sección de servicios dentro de la home. */
const SERVICES_ANCHOR = 'servicios';

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

// ─── Variantes de animación ──────────────────────────────────────────────────

/**
 * Overlay de fondo: fade + backdrop-blur.
 * Se usa una curva `easeOut` corta para que aparezca rápido pero sin brusquedad.
 */
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

/**
 * Panel lateral: slide horizontal con easing premium.
 *
 * `staggerChildren` + `delayChildren` orquestan la entrada en cascada de la
 * cabecera, los ítems y las redes sociales sin necesidad de delays manuales.
 */
const panelVariants: Variants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.05,
      delayChildren: 0.12,
    },
  },
  exit: {
    x: '-100%',
    transition: { duration: 0.32, ease: [0.4, 0, 1, 1] },
  },
};

/**
 * Cabecera del panel: pequeño fade + translateY descendente.
 * Crea sensación de capa que cae sobre el panel ya posicionado.
 */
const headerVariants: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Cada ítem del menú: fade + slide horizontal corto desde la izquierda.
 * Combinado con `staggerChildren` del padre, produce la cascada elegante.
 */
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Variantes simplificadas para `prefers-reduced-motion`. */
const reducedPanelVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.18, when: 'beforeChildren' },
  },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.12 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Desplaza suavemente la ventana hasta el elemento indicado, compensando el
 * offset acumulado de las barras fijas superiores (anuncio + navbar).
 *
 * En móvil NO se incluye la altura de `CatalogNavBar` porque esa barra está
 * oculta para viewports < lg.
 *
 * @param id - Valor del atributo `id` del elemento destino.
 */
const scrollToAnchor = (id: string): void => {
  const el = document.getElementById(id);
  if (!el) return;

  const style = getComputedStyle(document.documentElement);
  const announcementPx =
    parseFloat(style.getPropertyValue('--announcement-height')) || 36;
  const navbarPx = parseFloat(style.getPropertyValue('--navbar-height')) || 64;
  const offset = announcementPx + navbarPx + 16;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top, behavior: 'smooth' });
};

// ─── Props ───────────────────────────────────────────────────────────────────

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

// ─── Componente principal ───────────────────────────────────────────────────

/**
 * Menú lateral para pantallas móviles y tablets.
 *
 * Bloquea el scroll del documento mientras está abierto añadiendo
 * `overflow-hidden` al `<body>`. El efecto se limpia automáticamente al
 * cerrar el menú o al desmontar el componente.
 */
export const MobileMenu = ({
  isOpen,
  onClose,
  navItems,
  currentPath,
}: MobileMenuProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const firstName = user?.name.split(' ')[0] ?? '';

  // ── Bloqueo del scroll de fondo ─────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Cierre por tecla Esc ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // ── Handler especial para "Servicios" ───────────────────────────────────────
  /**
   * Si el usuario ya está en la home, hace scroll suave a la sección.
   * Si está en otra ruta, navega a `/` y delega el scroll al efecto de
   * `HomePage` mediante `location.state.scrollTo`.
   *
   * Se cierra el menú primero para que la animación de cierre no compita
   * visualmente con el scroll.
   */
  const handleServicesClick = () => {
    onClose();
    if (location.pathname === '/') {
      // Pequeño delay para esperar la animación de cierre del panel y evitar
      // que el scroll se ejecute mientras el panel sigue cubriendo la vista.
      window.setTimeout(() => scrollToAnchor(SERVICES_ANCHOR), 280);
    } else {
      navigate('/', { state: { scrollTo: SERVICES_ANCHOR } });
    }
  };

  // ── Ítems de navegación principal ──────────────────────────────────────────
  /**
   * Estructura unificada para que todos los ítems puedan animarse con el
   * mismo `itemVariants`, sean Link o botón con acción especial.
   *
   * El campo `action` es opcional: cuando existe, se renderiza como `<button>`
   * en lugar de `<Link>`. Útil para "Servicios", que es un anchor a la home.
   */
  const menuItems = [
    { label: 'Inicio', path: '/', icon: Home },
    ...navItems.map((item) => ({ ...item, icon: ShoppingBag })),
    {
      label: 'Servicios',
      path: '/#servicios',
      icon: Sparkles,
      action: handleServicesClick,
    },
    { label: 'Favoritos', path: FAVORITES_PATH, icon: Heart },
  ];

  // ── Selección de variantes según preferencia de movimiento ─────────────────
  const resolvedPanelVariants = shouldReduceMotion
    ? reducedPanelVariants
    : panelVariants;
  const resolvedItemVariants = shouldReduceMotion
    ? reducedItemVariants
    : itemVariants;
  const resolvedHeaderVariants = shouldReduceMotion
    ? reducedItemVariants
    : headerVariants;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Overlay de fondo con backdrop-blur ─────────────────────────── */}
          <motion.div
            key="mobile-menu-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 backdrop-blur-sm lg:hidden"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--bg-overlay) 78%, transparent)',
            }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Panel lateral ──────────────────────────────────────────────── */}
          <motion.aside
            key="mobile-menu-panel"
            variants={resolvedPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 bottom-0 left-0 z-50 flex w-[min(90vw,22.5rem)] flex-col overflow-y-auto border-r lg:hidden"
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
            {/* ── Cabecera del panel ───────────────────────────────────────── */}
            <motion.div
              variants={resolvedHeaderVariants}
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
            </motion.div>

            {/* ── Cuerpo del panel ─────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col px-5 py-6">
              {/*
               * Botón de contacto WhatsApp.
               * `whitespace-nowrap` evita fragmentar el número en viewports
               * estrechos (~320px). El layout usa `flex` con `min-w-0` para
               * contener correctamente ícono y texto en una fila.
               */}
              <motion.a
                variants={resolvedItemVariants}
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
                <WhatsAppIcon size={18} className="shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">+57 {WHATSAPP_NUMBER}</span>
              </motion.a>

              {/* ── Navegación principal ─────────────────────────────────── */}
              <nav className="mt-6 grid gap-1" aria-label="Navegación móvil">
                {menuItems.map(({ label, path, icon: Icon, action }) => {
                  /*
                   * El ítem "Servicios" no es comparable por pathname porque
                   * apunta a un anchor; nunca se considera "activo" en el
                   * sentido de ruta. Para los demás, se usa la lógica clásica
                   * de coincidencia exacta para `/` y `startsWith` para el resto.
                   */
                  const isActive = action
                    ? false
                    : path === '/'
                      ? currentPath === '/'
                      : currentPath.startsWith(path);

                  const commonClassName =
                    'grid grid-cols-[1.25rem_1fr] items-center gap-3 border-l px-4 py-3 transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

                  const commonStyle = {
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
                    textTransform: 'uppercase' as const,
                  };

                  /*
                   * Si el ítem trae una `action` se renderiza como botón.
                   * Mantenemos `motion.div` como envoltorio para que el
                   * stagger del padre lo alcance igual que a un Link.
                   */
                  if (action) {
                    return (
                      <motion.div key={path} variants={resolvedItemVariants}>
                        <button
                          type="button"
                          onClick={action}
                          className={`${commonClassName} w-full cursor-pointer text-left`}
                          style={{ ...commonStyle, background: 'none' }}
                        >
                          <Icon size={17} aria-hidden="true" />
                          {label}
                        </button>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div key={path} variants={resolvedItemVariants}>
                      <Link
                        to={path}
                        onClick={onClose}
                        className={commonClassName}
                        style={commonStyle}
                      >
                        <Icon size={17} aria-hidden="true" />
                        {label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* ── Sección de autenticación ─────────────────────────────── */}
              <motion.div
                variants={resolvedItemVariants}
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
              </motion.div>
            </div>

            {/* ── Redes sociales ─────────────────────────────────────────── */}
            <motion.div
              variants={resolvedItemVariants}
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
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Sub-componentes ────────────────────────────────────────────────────────

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
