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
 * ## Secciones de navegación
 * ```
 * ├── General           /admin/general      ← Configuración global del sistema
 * ├── Métricas          /admin/metricas
 * ├── Joyas             /admin/joyas        ← navegable + expandible
 * │   └── Categorías    /admin/categorias   ← subítem
 * ├── Clientes          /admin/clientes
 * └── Promociones       /admin/promociones
 * ```
 *
 * ## Comportamiento de ítems con subítems
 * Un ítem con `children` tiene DOS zonas de clic independientes:
 * - **Label + ícono** → navega a `item.path` (NavLink normal)
 * - **Botón chevron** → expande/colapsa los subítems sin navegar
 *
 * ## Sistema visual — estilo editorial clásico
 * El indicador de ítem activo es un borde izquierdo sólido de 2px
 * (`--border-accent`) sin border-radius, acompañado de un fondo sutil
 * derivado de `--accent-subtle`. En hover, una línea de 1px aparece con
 * transición de opacidad para no distraer. Este lenguaje visual transmite
 * estructura y elegancia sin elementos decorativos excesivos.
 *
 * ## Token de acento para dark mode — `--accent-vivid`
 * `--accent: #131638` tiene ratio 1.15:1 sobre `#1A1A1A`, prácticamente
 * invisible. Por eso el borde izquierdo activo, los íconos activos y el
 * texto de acento usan `--accent-vivid` (definido en `.dark {}` de
 * `tokens.css`) que provee contraste WCAG AA sobre fondos oscuros.
 * En light mode `--accent-vivid` no existe y el fallback natural de CSS
 * cae a `--border-accent` / `--text-primary` según el contexto.
 *
 * ## Animaciones
 * - Borde izquierdo activo: transición de `width` 0 → 2px + `opacity` 0 → 1
 * - Hover: `background-color` con `--transition-fast` (150 ms)
 * - Ícono: `translateX(2px)` en hover para dar sensación de profundidad
 * - Submenu: animación de altura con `max-height` + `opacity`
 * - Chevron: rotación suave 0° → 180° al expandir/colapsar
 *
 * ## Cómo agregar una nueva sección
 * Agrega un objeto al array `NAV_ITEMS`:
 * ```typescript
 * {
 *   label: 'Nueva sección',
 *   path: '/admin/nueva',
 *   icon: IconComponent,
 *   children: [                             // opcional
 *     { label: 'Subsección', path: '/admin/nueva/sub', icon: SubIcon },
 *   ],
 * }
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
  useState,
  type CSSProperties,
  type ElementType,
} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Gem,
  Tag,
  Users,
  Ticket,
  ChevronDown,
  X,
  Settings2,
} from 'lucide-react';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavSubItem {
  label: string;
  path: string;
  icon: ElementType;
}

interface NavItem {
  label: string;
  path: string;
  icon: ElementType;
  /** Subítems colapsables. El ítem padre sigue siendo navegable. */
  children?: NavSubItem[];
}

// ─── Estructura de navegación ─────────────────────────────────────────────────
// "Diseños" fue eliminado de la plataforma en esta versión.

const NAV_ITEMS: NavItem[] = [
  {
    label: 'General',
    path: '/admin/general',
    icon: Settings2,
  },
  {
    label: 'Métricas',
    path: '/admin/metricas',
    icon: BarChart3,
  },
  {
    label: 'Joyas',
    path: '/admin/joyas',
    icon: Gem,
    children: [{ label: 'Categorías', path: '/admin/categorias', icon: Tag }],
  },
  {
    label: 'Clientes',
    path: '/admin/clientes',
    icon: Users,
  },
  {
    label: 'Promociones',
    path: '/admin/promociones',
    icon: Ticket,
  },
];

// ─── Constantes de animación ──────────────────────────────────────────────────

/**
 * Duración base para transiciones de micro-interacciones del sidebar.
 * Deliberadamente corta para no interrumpir el flujo de trabajo del admin.
 */
const TRANSITION_ITEM = 'var(--transition-fast)';

/**
 * Duración para la animación del submenu (expand/collapse).
 * Ligeramente más lenta para que la expansión se perciba fluida.
 */
const TRANSITION_SUBMENU = 'var(--transition-normal)';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Sidebar de navegación del panel de administración.
 * Gestiona el estado de expansión de subítems localmente.
 * El drawer móvil incluye botón de cierre propio para no depender del topbar.
 */
export const AdminSidebar = ({
  isOpen,
  isCollapsed,
  onClose,
}: AdminSidebarProps) => {
  const { pathname } = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    '/admin/joyas',
  ]);

  // Auto-expande el padre cuando la ruta activa es un subítem.
  useEffect(() => {
    const activeParent = NAV_ITEMS.find((item) =>
      item.children?.some((child) => pathname.startsWith(child.path)),
    );

    if (!activeParent) return;

    setExpandedItems((prev) =>
      prev.includes(activeParent.path) ? prev : [...prev, activeParent.path],
    );
  }, [pathname]);

  const toggleItem = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const sidebarStyle = {
    '--admin-sidebar-width': isCollapsed
      ? 'var(--sidebar-width-collapsed)'
      : 'var(--sidebar-width)',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    boxShadow: isOpen ? 'var(--shadow-xl)' : 'var(--shadow-sm)',
  } as CSSProperties;

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
          <div className="flex min-w-0 items-center gap-3">
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
          </div>

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
        <nav
          className={`flex flex-col gap-1 py-4 ${isCollapsed ? 'lg:px-2' : 'px-0'}`}
          aria-label="Menú de administración"
        >
          {/*
           * Etiqueta de sección.
           * Se oculta en modo colapsado para respetar el espacio reducido.
           */}
          <div className={`px-4 pb-2 pt-1 ${isCollapsed ? 'lg:hidden' : ''}`}>
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
          </div>

          {NAV_ITEMS.map((item) => (
            <NavItemComponent
              key={item.path}
              item={item}
              isCollapsed={isCollapsed}
              isExpanded={expandedItems.includes(item.path)}
              currentPath={pathname}
              onToggleExpand={() => toggleItem(item.path)}
              onClose={onClose}
            />
          ))}
        </nav>

        {/* ── Pie del sidebar ─────────────────────────────────────────────── */}
        <div className={`mt-auto ${isCollapsed ? 'lg:hidden' : ''}`}>
          <div
            className="flex-shrink-0 px-4 py-4"
            style={{ borderTop: '1px solid var(--border-color)' }}
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
          </div>
        </div>
      </aside>
    </>
  );
};

// ─── Subcomponente: ítem de navegación ───────────────────────────────────────

interface NavItemComponentProps {
  item: NavItem;
  isCollapsed: boolean;
  isExpanded: boolean;
  currentPath: string;
  onToggleExpand: () => void;
  onClose: () => void;
}

/**
 * Ítem de navegación del sidebar admin.
 *
 * ## Indicador activo — estilo editorial
 * En lugar de un fondo redondeado, el ítem activo muestra:
 * - Un borde izquierdo sólido de 2px en `--border-accent`
 * - Un fondo plano sutil usando `--accent-subtle` como superficie
 * - Sin `border-radius` en ninguno de los dos elementos
 *
 * En hover (no activo):
 * - `--bg-hover` como fondo
 * - El ícono se desplaza 2px hacia la derecha con `translateX` para dar
 *   sensación de movimiento sin ser invasivo.
 *
 * @internal Solo se usa dentro de `AdminSidebar`.
 */
const NavItemComponent = ({
  item,
  isCollapsed,
  isExpanded,
  currentPath,
  onToggleExpand,
  onClose,
}: NavItemComponentProps) => {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);

  /*
   * isSectionActive: verdadero si la ruta activa es este ítem o alguno de
   * sus hijos. Se usa para resaltar el padre aunque el foco esté en un hijo.
   */
  const isSectionActive =
    currentPath.startsWith(item.path) ||
    Boolean(item.children?.some((child) => currentPath.startsWith(child.path)));

  /**
   * Estilos del ítem principal.
   *
   * El borde izquierdo activo usa `--accent-vivid` en dark mode para
   * garantizar contraste suficiente (el token está definido en `.dark {}`
   * de `tokens.css`). En light mode `--accent-vivid` no existe como variable
   * separada, por lo que se usa `--border-accent` directamente.
   * Se implementa con `borderLeft` para respetar el lenguaje editorial
   * plano, sin border-radius.
   *
   * @param isActive - Valor de `isActive` de NavLink (ruta exacta).
   */
  const getItemStyle = (isActive: boolean): CSSProperties => ({
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--leading-normal)',
    color:
      isActive || isSectionActive
        ? 'var(--text-primary)'
        : 'var(--text-secondary)',
    fontWeight:
      isActive || isSectionActive
        ? 'var(--font-semibold)'
        : 'var(--font-medium)',
    backgroundColor:
      isActive || isSectionActive ? 'var(--accent-subtle)' : 'transparent',
    /*
     * `--accent-vivid` es el azul luminoso definido en `.dark {}`.
     * En light mode el token no existe: CSS resuelve la var como vacía
     * y el fallback cae al valor por defecto del navegador (none),
     * por eso se usa `var(--accent-vivid, var(--border-accent))` para
     * garantizar el color correcto en ambos modos sin lógica extra.
     */
    borderLeft:
      isActive || isSectionActive
        ? '2px solid var(--accent-vivid, var(--border-accent))'
        : '2px solid transparent',
    transition: `background-color ${TRANSITION_ITEM}, border-color ${TRANSITION_ITEM}, color ${TRANSITION_ITEM}`,
  });

  if (hasChildren) {
    return (
      <div>
        {/* Fila del ítem padre: NavLink + botón chevron separados */}
        <div className="flex items-center">
          <NavLink
            to={item.path}
            onClick={onClose}
            title={isCollapsed ? item.label : undefined}
            className={`group flex min-h-12 min-w-0 flex-1 items-center gap-3.5 px-4 py-3
              focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]
              ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
            `}
            style={({ isActive }) => getItemStyle(isActive)}
            onMouseEnter={(e) => {
              if (!isSectionActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSectionActive) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'transparent';
              }
            }}
          >
            {({ isActive }) => (
              <>
                {/*
                 * Ícono: se desplaza ligeramente en hover para dar
                 * sensación de profundidad sin ser invasivo.
                 */}
                <Icon
                  size={20}
                  className="flex-shrink-0"
                  style={{
                    /*
                     * Ícono activo: usa `--accent-vivid` en dark mode para
                     * garantizar visibilidad. Fallback a `--text-primary`
                     * en light donde el token no está definido.
                     */
                    color:
                      isActive || isSectionActive
                        ? 'var(--accent-vivid, var(--text-primary))'
                        : 'var(--text-secondary)',
                    transition: `transform ${TRANSITION_ITEM}, color ${TRANSITION_ITEM}`,
                  }}
                />
                <span
                  className={`min-w-0 truncate ${isCollapsed ? 'lg:hidden' : ''}`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>

          {/* Botón chevron — independiente del NavLink */}
          <div className={isCollapsed ? 'lg:hidden' : ''}>
            <button
              onClick={onToggleExpand}
              className="flex h-12 w-11 flex-shrink-0 cursor-pointer items-center justify-center
                focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
              style={{
                color: 'var(--text-muted)',
                transition: `background-color ${TRANSITION_ITEM}`,
              }}
              aria-label={
                isExpanded ? `Colapsar ${item.label}` : `Expandir ${item.label}`
              }
              aria-expanded={isExpanded}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'transparent';
              }}
            >
              {/*
               * Chevron animado: rota 180° cuando el submenú está abierto.
               * La transición de `transform` coincide con la del submenú.
               */}
              <ChevronDown
                size={16}
                style={{
                  transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: `transform ${TRANSITION_SUBMENU}`,
                }}
              />
            </button>
          </div>
        </div>

        {/* Submenú animado con max-height para transición suave */}
        <SubMenuPanel isExpanded={isExpanded} isCollapsed={isCollapsed}>
          {item.children!.map((child) => (
            <SubNavItem key={child.path} item={child} onClose={onClose} />
          ))}
        </SubMenuPanel>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      title={isCollapsed ? item.label : undefined}
      className={`group flex min-h-12 min-w-0 items-center gap-3.5 px-4 py-3
        focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]
        ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
      `}
      style={({ isActive }) => getItemStyle(isActive)}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (el.getAttribute('data-active') !== 'true') {
          el.style.backgroundColor = 'var(--bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (el.getAttribute('data-active') !== 'true') {
          el.style.backgroundColor = 'transparent';
        }
      }}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={20}
            className="flex-shrink-0"
            style={{
              /*
               * Mismo patrón que el ítem con hijos: `--accent-vivid` en dark,
               * fallback a `--text-primary` en light.
               */
              color: isActive
                ? 'var(--accent-vivid, var(--text-primary))'
                : 'var(--text-secondary)',
              transition: `transform ${TRANSITION_ITEM}, color ${TRANSITION_ITEM}`,
            }}
          />
          <span
            className={`min-w-0 truncate ${isCollapsed ? 'lg:hidden' : ''}`}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
};

// ─── Subcomponente: panel animado del submenú ─────────────────────────────────

interface SubMenuPanelProps {
  isExpanded: boolean;
  isCollapsed: boolean;
  children: React.ReactNode;
}

/**
 * Contenedor animado para los subítems de un ítem padre.
 *
 * Usa `max-height` + `opacity` para lograr una transición de
 * expand/collapse sin JavaScript adicional. El valor de `max-height`
 * es generoso (400 px) para absorber cualquier número razonable de hijos.
 *
 * Se oculta completamente cuando el sidebar está colapsado en desktop.
 *
 * @internal Solo se usa dentro de `NavItemComponent`.
 */
const SubMenuPanel = ({
  isExpanded,
  isCollapsed,
  children,
}: SubMenuPanelProps) => (
  <ul
    className={`flex flex-col overflow-hidden ${isCollapsed ? 'lg:hidden' : ''}`}
    style={{
      maxHeight: isExpanded ? '400px' : '0px',
      opacity: isExpanded ? 1 : 0,
      transition: `max-height ${TRANSITION_SUBMENU}, opacity ${TRANSITION_SUBMENU}`,
      /*
       * Línea vertical de guía que conecta visualmente los subítems con
       * el ítem padre. Usa `--border-color` para adaptarse a ambos modos.
       */
      borderLeft: '1px solid var(--border-color)',
      marginLeft: '1.5rem',
      paddingLeft: '0',
      marginTop: isExpanded ? '2px' : '0px',
      marginBottom: isExpanded ? '4px' : '0px',
    }}
  >
    {children}
  </ul>
);

// ─── Subcomponente: subítem de navegación ─────────────────────────────────────

interface SubNavItemProps {
  item: NavSubItem;
  onClose: () => void;
}

/**
 * Subítem de navegación dentro del panel expandido de un ítem padre.
 *
 * Mismo lenguaje visual que los ítems principales: borde izquierdo activo,
 * sin border-radius, hover con fondo plano. El tamaño de texto y la
 * indentación son ligeramente menores para establecer jerarquía visual.
 *
 * @internal Solo se usa dentro de `SubMenuPanel`.
 */
const SubNavItem = ({ item, onClose }: SubNavItemProps) => {
  const Icon = item.icon;

  return (
    <li>
      <NavLink
        to={item.path}
        onClick={onClose}
        className="flex min-h-10 min-w-0 items-center gap-3 py-2.5 pl-4 pr-4
          focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
        style={({ isActive }) => ({
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          lineHeight: 'var(--leading-normal)',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
          backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
          /*
           * Mismo patrón que el ítem padre: `--accent-vivid` con fallback
           * a `--border-accent` para light mode. El borde del subítem es
           * igual (2px) al del padre; la jerarquía visual se establece
           * por tamaño de texto e indentación, no por grosor de borde.
           */
          borderLeft: isActive
            ? '2px solid var(--accent-vivid, var(--border-accent))'
            : '2px solid transparent',
          transition: `background-color ${TRANSITION_ITEM}, border-color ${TRANSITION_ITEM}, color ${TRANSITION_ITEM}`,
        })}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (el.getAttribute('aria-current') !== 'page') {
            el.style.backgroundColor = 'var(--bg-hover)';
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (el.getAttribute('aria-current') !== 'page') {
            el.style.backgroundColor = 'transparent';
          }
        }}
      >
        {({ isActive }) => (
          <>
            <Icon
              size={16}
              className="flex-shrink-0"
              style={{
                color: isActive
                  ? 'var(--accent-vivid, var(--text-primary))'
                  : 'var(--text-muted)',
                transition: `color ${TRANSITION_ITEM}`,
              }}
            />
            <span className="min-w-0 truncate">{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
};
