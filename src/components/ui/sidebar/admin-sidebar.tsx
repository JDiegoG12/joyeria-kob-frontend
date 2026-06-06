/**
 * @file admin-sidebar.tsx
 * @description Sidebar de navegación del panel de administración de Joyería KOB.
 *
 * ## Comportamiento por breakpoint
 * - **Desktop (lg+)**: `fixed`, siempre visible. Puede colapsarse a solo
 *   íconos mediante el botón en `AdminTopbar` que controla `isCollapsed`.
 *   El ancho alterna entre `--sidebar-width` y `--sidebar-width-collapsed`.
 * - **Tablet/Móvil**: cajón `fixed` que se desliza desde la izquierda,
 *   controlado por `isOpen`/`onClose` desde `AdminLayout`.
 *   El botón de cierre vive en la cabecera del drawer.
 *
 * ## Posicionamiento
 * En desktop ocupa toda la altura para alojar el bloque de marca arriba.
 * En móvil se comporta como drawer superpuesto al contenido.
 *
 * ## Secciones de navegación (estructura PLANA — sin anidamiento)
 * ```
 * ├── General        /admin/general      ← Configuración global del sistema
 * ├── Métricas       /admin/metricas
 * ├── Joyas          /admin/joyas
 * ├── Categorías     /admin/categorias   ← antes anidada bajo Joyas, ahora top-level
 * ├── Clientes       /admin/clientes
 * └── Promociones    /admin/promociones
 * ```
 * Anteriormente "Categorías" era un subítem de "Joyas" (menú colapsable con
 * chevron). Se promovió a ítem de primer nivel y se eliminó toda la maquinaria
 * de submenús (chevron, panel expandible, estado de expansión) por quedar sin
 * uso. Para volver a anidar en el futuro habría que reintroducir ese patrón.
 *
 * ## Sistema visual — estilo editorial clásico
 * El indicador de ítem activo es un fondo plano sutil (`--accent-subtle`) con
 * un borde izquierdo sólido de 2px (`--accent-vivid`), sin border-radius.
 *
 * ## Token de acento para dark mode — `--accent-vivid`
 * `--accent: #131638` tiene ratio 1.15:1 sobre `#1A1A1A`, prácticamente
 * invisible. Por eso el borde izquierdo activo, los íconos activos y el texto
 * de acento usan `--accent-vivid` (definido en `.dark {}` de `tokens.css`) que
 * provee contraste WCAG AA sobre fondos oscuros. En light mode `--accent-vivid`
 * no existe y el fallback de CSS cae a `--border-accent` / `--text-primary`.
 *
 * ## Animaciones (dirección "Glide + Glow", con framer-motion)
 * Unificadas con el resto de la app (catálogo/favoritos ya usan framer-motion):
 * - **Indicador activo deslizante**: el fondo + borde del ítem activo es un
 *   elemento compartido (`layoutId`) que se *desliza* de un ítem a otro al
 *   navegar, en lugar de aparecer/desaparecer en seco.
 * - **Entrada escalonada**: la etiqueta de sección y los ítems entran con un
 *   fade + deslizamiento desde la izquierda, en cascada (`staggerChildren`).
 * - **Pop del ícono**: al volverse activo un ítem, su ícono hace un micro-
 *   rebote de escala (solo en la transición no-activo → activo).
 * - **Hover**: fade del fondo + una barra de acento vertical que crece desde
 *   el centro (`scaleY`) + leve desplazamiento del ícono.
 * - **Marca y pie**: fade-up sutil al montar.
 *
 * Todo respeta `prefers-reduced-motion` (vía `useReducedMotion` para JS y la
 * variante `motion-reduce:` de Tailwind para las transiciones CSS de hover):
 * con movimiento reducido, el indicador salta sin deslizarse, no hay cascada
 * ni pop, y las barras de hover aparecen sin transición.
 *
 * ## Cómo agregar una nueva sección
 * Agrega un objeto al array `NAV_ITEMS`:
 * ```typescript
 * { label: 'Nueva sección', path: '/admin/nueva', icon: IconComponent }
 * ```
 *
 * ## Uso
 * ```tsx
 * <AdminSidebar
 *   isOpen={sidebarOpen}
 *   isCollapsed={collapsed}
 *   onClose={() => setSidebarOpen(false)}
 * />
 * ```
 */

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  motion,
  useAnimationControls,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import {
  BarChart3,
  Gem,
  Tag,
  Users,
  Ticket,
  X,
  Settings2,
} from 'lucide-react';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: ElementType;
}

// ─── Estructura de navegación ─────────────────────────────────────────────────
// Estructura plana: "Categorías" ya no está anidada bajo "Joyas".
// "Diseños" fue eliminado de la plataforma en esta versión.

const NAV_ITEMS: NavItem[] = [
  { label: 'General', path: '/admin/general', icon: Settings2 },
  { label: 'Métricas', path: '/admin/metricas', icon: BarChart3 },
  { label: 'Joyas', path: '/admin/joyas', icon: Gem },
  { label: 'Categorías', path: '/admin/categorias', icon: Tag },
  { label: 'Clientes', path: '/admin/clientes', icon: Users },
  { label: 'Promociones', path: '/admin/promociones', icon: Ticket },
];

// ─── Constantes de animación ──────────────────────────────────────────────────

/** Transición rápida para color de íconos/labels (micro-interacciones). */
const TRANSITION_FAST = 'var(--transition-fast)';

/** layoutId compartido del indicador activo (la "línea/superficie" que glide). */
const ACTIVE_LAYOUT_ID = 'admin-sidebar-active';

/**
 * Contenedor de la cascada de entrada. `staggerChildren` reparte la aparición
 * de los ítems; `delayChildren` da un pequeño respiro tras montar el aside.
 */
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

/**
 * Cada ítem (y la etiqueta de sección) entra con fade + deslizamiento desde la
 * izquierda. El easing `[0.22, 1, 0.36, 1]` es el mismo "ease-out expresivo"
 * usado en el catálogo, para una identidad de movimiento consistente.
 */
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Sidebar de navegación del panel de administración.
 * El drawer móvil incluye botón de cierre propio para no depender del topbar.
 */
export const AdminSidebar = ({
  isOpen,
  isCollapsed,
  onClose,
}: AdminSidebarProps) => {
  const { pathname } = useLocation();
  const reduced = useReducedMotion() ?? false;

  const sidebarStyle = {
    '--admin-sidebar-width': isCollapsed
      ? 'var(--sidebar-width-collapsed)'
      : 'var(--sidebar-width)',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    boxShadow: isOpen ? 'var(--shadow-xl)' : 'var(--shadow-sm)',
  } as CSSProperties;

  /**
   * Props de la cascada de entrada. Con movimiento reducido se omiten por
   * completo: los hijos quedan con sus `variants` definidas pero sin `animate`,
   * por lo que se renderizan visibles al instante (sin cascada).
   */
  const staggerProps = reduced
    ? {}
    : ({ variants: containerVariants, initial: 'hidden', animate: 'visible' } as const);

  /** Fade-up sutil para marca y pie (omitido con movimiento reducido). */
  const fadeProps = (fromY: number) =>
    reduced
      ? {}
      : ({
          initial: { opacity: 0, y: fromY },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: 'easeOut' },
        } as const);

  return (
    <>
      {/* ── Overlay — solo móvil/tablet ─────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        style={{ backgroundColor: 'var(--bg-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ───────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 z-[60] flex h-dvh w-[min(86vw,var(--sidebar-width))] flex-col
          overflow-x-hidden overflow-y-auto
          transition-all duration-300 ease-in-out
          lg:z-50 lg:w-[var(--admin-sidebar-width)] lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={sidebarStyle}
        aria-label="Navegación del panel admin"
      >
        {/* ── Cabecera: marca y cierre del drawer móvil ───────────────────── */}
        <div
          className={`flex min-h-16 flex-shrink-0 items-center justify-between gap-3 px-3 py-2.5 ${
            isCollapsed ? 'lg:justify-center' : ''
          }`}
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <motion.div
            className="flex min-w-0 items-center gap-3"
            {...fadeProps(-6)}
          >
            {/*
             * Contenedor del logo: sin border-radius pronunciado,
             * estilo cuadrado acorde al lenguaje editorial.
             */}
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-active)',
                border: '1px solid var(--border-color)',
              }}
            >
              <KobLogo size={34} className="block" />
            </div>

            <div
              className={`min-w-0 transition-opacity duration-200 ${
                isCollapsed ? 'lg:hidden' : ''
              }`}
            >
              <p
                className="truncate"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-bold)',
                  lineHeight: 'var(--leading-tight)',
                  color: 'var(--text-primary)',
                }}
              >
                Joyería KOB
              </p>
              <p
                className="truncate"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.2,
                }}
              >
                Panel administrativo
              </p>
            </div>
          </motion.div>

          {/* Botón de cierre — solo visible en mobile/tablet */}
          <button
            onClick={onClose}
            className="cursor-pointer p-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:hidden"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Cerrar menú de administración"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Navegación ──────────────────────────────────────────────────── */}
        <motion.nav
          className={`flex flex-col py-4 ${isCollapsed ? 'lg:px-2' : 'px-0'}`}
          aria-label="Menú de administración"
          {...staggerProps}
        >
          {/*
           * Etiqueta de sección.
           * Se oculta en modo colapsado para respetar el espacio reducido.
           */}
          <motion.div
            variants={itemVariants}
            className={`px-4 pb-2 pt-1 ${isCollapsed ? 'lg:hidden' : ''}`}
          >
            <p
              className="uppercase"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-bold)',
                letterSpacing: 'var(--tracking-widest)',
                color: 'var(--text-muted)',
              }}
            >
              Administración
            </p>
          </motion.div>

          <ul className="flex list-none flex-col gap-1 p-0">
            {NAV_ITEMS.map((item) => (
              <NavItemComponent
                key={item.path}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                reduced={reduced}
                onClose={onClose}
              />
            ))}
          </ul>
        </motion.nav>

        {/* ── Pie del sidebar ─────────────────────────────────────────────── */}
        <div className={`mt-auto ${isCollapsed ? 'lg:hidden' : ''}`}>
          <motion.div
            className="flex-shrink-0 px-4 py-4"
            style={{ borderTop: '1px solid var(--border-color)' }}
            {...fadeProps(6)}
          >
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-muted)',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              Panel Admin · KOB
            </p>
          </motion.div>
        </div>
      </aside>
    </>
  );
};

// ─── Subcomponente: ítem de navegación ───────────────────────────────────────

interface NavItemComponentProps {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
  reduced: boolean;
  onClose: () => void;
}

/**
 * Ítem de navegación del sidebar admin (dirección "Glide + Glow").
 *
 * ## Capas (de atrás hacia adelante)
 * 1. **Hover bg** (solo no-activo): fade de `--bg-hover` con la opacidad.
 * 2. **Barra de hover** (solo no-activo): acento vertical de 2px que crece
 *    desde el centro con `scaleY` al pasar el cursor.
 * 3. **Indicador activo** (solo activo): superficie `--accent-subtle` + borde
 *    izquierdo `--accent-vivid` con `layoutId` compartido → se *desliza* entre
 *    ítems al navegar.
 * 4. **Contenido**: ícono (con micro-pop al activarse) + label.
 *
 * `isActive` se calcula localmente (coincidencia exacta o ruta descendiente)
 * para poder ubicar el indicador `layoutId` y disparar el pop; `NavLink` sigue
 * gestionando navegación y `aria-current`.
 *
 * @internal Solo se usa dentro de `AdminSidebar`.
 */
const NavItemComponent = ({
  item,
  pathname,
  isCollapsed,
  reduced,
  onClose,
}: NavItemComponentProps) => {
  const Icon = item.icon;

  // Activo si la ruta es exactamente este ítem o una ruta descendiente
  // (replica el matching por defecto de NavLink sin `end`).
  const isActive =
    pathname === item.path || pathname.startsWith(`${item.path}/`);

  // ── Micro-pop del ícono SOLO en la transición no-activo → activo ──────────
  const iconControls = useAnimationControls();
  const prevActive = useRef(isActive);

  useEffect(() => {
    if (!prevActive.current && isActive && !reduced) {
      void iconControls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.35, ease: 'easeOut' },
      });
    }
    prevActive.current = isActive;
  }, [isActive, reduced, iconControls]);

  /**
   * Transición del indicador deslizante: resorte para un glide premium; salto
   * instantáneo (`duration: 0`) cuando el usuario pide movimiento reducido.
   */
  const activeTransition = reduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 380, damping: 32 };

  return (
    <motion.li variants={itemVariants} className="list-none">
      <NavLink
        to={item.path}
        onClick={onClose}
        title={isCollapsed ? item.label : undefined}
        className={`group relative flex min-h-12 min-w-0 items-center overflow-hidden px-4 py-3
          outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]
          ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
        `}
      >
        {/* 1. Hover bg (solo no-activo) — fade de opacidad, GPU-friendly */}
        {!isActive && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
            style={{ backgroundColor: 'var(--bg-hover)' }}
          />
        )}

        {/* 2. Barra de hover (solo no-activo) — crece desde el centro */}
        {!isActive && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-0 w-0.5 origin-center scale-y-0 transition-transform duration-200 ease-out group-hover:scale-y-100 motion-reduce:transition-none"
            style={{ backgroundColor: 'var(--border-accent)' }}
          />
        )}

        {/* 3. Indicador activo deslizante (layoutId compartido) */}
        {isActive && (
          <motion.span
            aria-hidden="true"
            layoutId={ACTIVE_LAYOUT_ID}
            className="absolute inset-0"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              borderLeft: '2px solid var(--accent-vivid, var(--border-accent))',
            }}
            transition={activeTransition}
          />
        )}

        {/* 4. Contenido por encima de las capas decorativas */}
        <span className="relative z-10 flex min-w-0 items-center gap-3.5">
          <motion.span
            animate={iconControls}
            className="flex flex-shrink-0"
            style={{ transformOrigin: 'center' }}
          >
            <Icon
              size={20}
              className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              style={{
                color: isActive
                  ? 'var(--accent-vivid, var(--text-primary))'
                  : 'var(--text-secondary)',
                transition: `color ${TRANSITION_FAST}`,
              }}
            />
          </motion.span>

          <span
            className={`min-w-0 truncate ${isCollapsed ? 'lg:hidden' : ''}`}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-base)',
              lineHeight: 'var(--leading-normal)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive
                ? 'var(--font-semibold)'
                : 'var(--font-medium)',
              transition: `color ${TRANSITION_FAST}`,
            }}
          >
            {item.label}
          </span>
        </span>
      </NavLink>
    </motion.li>
  );
};
