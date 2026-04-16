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
 * ├── Métricas          /admin/metricas
 * ├── Joyas             /admin/joyas        ← navegable + expandible
 * │   └── Categorías    /admin/categorias   ← subítem
 * ├── Clientes          /admin/clientes
 * ├── Diseños           /admin/disenos
 * └── Promociones       /admin/promociones
 * ```
 *
 * ## Comportamiento de ítems con subítems
 * Un ítem con `children` tiene DOS zonas de clic independientes:
 * - **Label + ícono** → navega a `item.path` (NavLink normal)
 * - **Botón chevron** → expande/colapsa los subítems sin navegar
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
  PenTool,
  Ticket,
  ChevronDown,
  ChevronRight,
  X,
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

const NAV_ITEMS: NavItem[] = [
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
    label: 'Diseños',
    path: '/admin/disenos',
    icon: PenTool,
  },
  {
    label: 'Promociones',
    path: '/admin/promociones',
    icon: Ticket,
  },
];

// ─── Estilos compartidos de navegación ───────────────────────────────────────

/**
 * Superficie visual para un ítem activo.
 * Usa `color-mix` con tokens existentes para elevar contraste sin tocar
 * `tokens.css` ni introducir colores hardcodeados.
 */
const getActiveItemSurface = (isActive: boolean): CSSProperties => ({
  background: isActive
    ? 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 18%, var(--bg-sidebar)), color-mix(in srgb, var(--accent) 9%, var(--bg-sidebar)))'
    : 'transparent',
  boxShadow: isActive
    ? 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 32%, transparent)'
    : 'none',
});

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
        {/* Cabecera: marca estable y cierre propio del drawer móvil. */}
        <div
          className={`flex min-h-16 flex-shrink-0 items-center justify-between gap-3 px-3 py-2.5 ${
            isCollapsed ? 'lg:justify-center' : ''
          }`}
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md"
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

          <button
            onClick={onClose}
            className="cursor-pointer rounded-md p-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:hidden"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Cerrar menú de administración"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegación */}
        <nav
          className={`flex flex-col gap-2 p-4 ${isCollapsed ? 'lg:px-2' : ''}`}
          aria-label="Menú de administración"
        >
          <div className={isCollapsed ? 'lg:hidden' : ''}>
            <p
              className="px-3 pb-2 pt-1 uppercase"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-bold)',
                letterSpacing: 'var(--tracking-wide)',
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

        {/* Pie del sidebar */}
        <div className={`mt-auto ${isCollapsed ? 'lg:hidden' : ''}`}>
          <div
            className="mt-auto flex-shrink-0 px-4 py-4"
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
  const isSectionActive =
    currentPath.startsWith(item.path) ||
    Boolean(item.children?.some((child) => currentPath.startsWith(child.path)));

  if (hasChildren) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <NavLink
            to={item.path}
            onClick={onClose}
            title={isCollapsed ? item.label : undefined}
            className={`group relative flex min-h-12 min-w-0 flex-1 items-center gap-3.5 rounded-md px-3.5 py-3 transition-all duration-200 ease-out hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              isCollapsed ? 'lg:justify-center' : ''
            }`}
            style={({ isActive }) => ({
              ...getActiveItemSurface(isSectionActive),
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-base)',
              lineHeight: 'var(--leading-normal)',
              color: isSectionActive
                ? 'var(--accent)'
                : 'var(--text-secondary)',
              fontWeight:
                isActive || isSectionActive
                  ? 'var(--font-bold)'
                  : 'var(--font-medium)',
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-2.5 bottom-2.5 left-0 w-1.5 rounded-full transition-opacity duration-200 ${
                    isSectionActive ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ backgroundColor: 'var(--accent)' }}
                />
                <Icon
                  size={22}
                  className="flex-shrink-0 transition-colors duration-200"
                  style={{
                    color:
                      isActive || isSectionActive
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                  }}
                />
                <span
                  className={`min-w-0 truncate ${
                    isCollapsed ? 'lg:hidden' : ''
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>

          <div className={isCollapsed ? 'lg:hidden' : ''}>
            <button
              onClick={onToggleExpand}
              className="flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-md transition-all duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{ color: 'var(--text-muted)' }}
              aria-label={
                isExpanded ? `Colapsar ${item.label}` : `Expandir ${item.label}`
              }
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <ul
            className={`ml-7 mt-2 flex flex-col gap-1.5 border-l pl-3 ${
              isCollapsed ? 'lg:hidden' : ''
            }`}
            style={{ borderColor: 'var(--border-color)' }}
          >
            {item.children!.map((child) => (
              <li key={child.path}>
                <SubNavItem item={child} onClose={onClose} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      title={isCollapsed ? item.label : undefined}
      className={`group relative flex min-h-12 min-w-0 items-center gap-3.5 rounded-md px-3.5 py-3 transition-all duration-200 ease-out hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        isCollapsed ? 'lg:justify-center' : ''
      }`}
      style={({ isActive }) => ({
        ...getActiveItemSurface(isActive),
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-base)',
        lineHeight: 'var(--leading-normal)',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: isActive ? 'var(--font-bold)' : 'var(--font-medium)',
      })}
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute top-2.5 bottom-2.5 left-0 w-1.5 rounded-full transition-opacity duration-200 ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <Icon
            size={22}
            className="flex-shrink-0 transition-colors duration-200"
            style={{
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
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

// ─── Subcomponente: subítem ───────────────────────────────────────────────────

interface SubNavItemProps {
  item: NavSubItem;
  onClose: () => void;
}

/**
 * Subítem de navegación dentro de un ítem padre expandido.
 * @internal Solo se usa dentro de `NavItemComponent`.
 */
const SubNavItem = ({ item, onClose }: SubNavItemProps) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className="relative flex min-h-11 min-w-0 items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      style={({ isActive }) => ({
        ...getActiveItemSurface(isActive),
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-base)',
        lineHeight: 'var(--leading-normal)',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: isActive ? 'var(--font-bold)' : 'var(--font-medium)',
        borderRadius: 'var(--radius-md)',
      })}
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute top-2.5 bottom-2.5 left-0 w-1 rounded-full transition-opacity duration-200 ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <Icon
            size={18}
            className="flex-shrink-0"
            style={{
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          />
          <span className="min-w-0 truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
};
