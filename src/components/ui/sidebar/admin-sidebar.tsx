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
 *   El botón de cierre vive en el topbar (toggle hamburguesa/X).
 *
 * ## Posicionamiento
 * Usa la clase `.sidebar-panel` de `tokens.css` para manejar `top` y
 * `height` según el breakpoint sin necesidad de calcular en JS.
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

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Gem,
  Tag,
  Users,
  PenTool,
  Ticket,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { KobLogo } from '@/components/ui/navbar/kob-logo';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavSubItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
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
 * El botón de cierre en mobile vive en el topbar — no en este componente.
 */
export const AdminSidebar = ({
  isOpen,
  isCollapsed,
  onClose,
}: AdminSidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([
    '/admin/joyas',
  ]);

  const toggleItem = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  return (
    <>
      {/* ── Overlay — solo móvil/tablet ─────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 lg:hidden ${
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
          fixed left-0 z-40 flex flex-col
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          sidebar-panel
        `}
        style={{
          width: isCollapsed
            ? 'var(--sidebar-width-collapsed)'
            : 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
        aria-label="Navegación del panel admin"
      >
        {/* Cabecera — solo logo, sin botón X (el toggle está en el topbar) */}
        <div
          className="flex flex-shrink-0 items-center justify-center px-4 py-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div
            className={`transition-opacity duration-200 ${
              isCollapsed ? 'opacity-0 lg:invisible' : 'opacity-100'
            }`}
          >
            <KobLogo />
          </div>
        </div>

        {/* Navegación */}
        <nav
          className="flex flex-col gap-1 p-3"
          aria-label="Menú de administración"
        >
          {NAV_ITEMS.map((item) => (
            <NavItemComponent
              key={item.path}
              item={item}
              isCollapsed={isCollapsed}
              isExpanded={expandedItems.includes(item.path)}
              onToggleExpand={() => toggleItem(item.path)}
              onClose={onClose}
            />
          ))}
        </nav>

        {/* Pie del sidebar */}
        {!isCollapsed && (
          <div
            className="mt-auto flex-shrink-0 px-4 py-4"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              Panel Admin · KOB
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

// ─── Subcomponente: ítem de navegación ───────────────────────────────────────

interface NavItemComponentProps {
  item: NavItem;
  isCollapsed: boolean;
  isExpanded: boolean;
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
  onToggleExpand,
  onClose,
}: NavItemComponentProps) => {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);

  if (hasChildren) {
    return (
      <div>
        <div className="flex items-center">
          <NavLink
            to={item.path}
            onClick={onClose}
            title={isCollapsed ? item.label : undefined}
            className="flex flex-1 items-center gap-3 rounded-md px-3 py-2.5 transition-colors"
            style={({ isActive }) => ({
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              backgroundColor: isActive
                ? 'var(--accent-subtle)'
                : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: isActive
                ? 'var(--font-semibold)'
                : 'var(--font-medium)',
              borderLeft:
                isActive && !isCollapsed
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className="flex-shrink-0"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>

          {!isCollapsed && (
            <button
              onClick={onToggleExpand}
              className="flex-shrink-0 rounded-md p-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label={
                isExpanded ? `Colapsar ${item.label}` : `Expandir ${item.label}`
              }
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </button>
          )}
        </div>

        {isExpanded && !isCollapsed && (
          <ul className="mt-1 flex flex-col gap-0.5 pl-4">
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
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
        isCollapsed ? 'justify-center' : ''
      }`}
      style={({ isActive }) => ({
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
        borderLeft:
          isActive && !isCollapsed
            ? '2px solid var(--accent)'
            : '2px solid transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className="flex-shrink-0"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
          />
          {!isCollapsed && <span>{item.label}</span>}
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
      className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
      style={({ isActive }) => ({
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
        borderLeft: isActive
          ? '2px solid var(--accent)'
          : '2px solid transparent',
        borderRadius: 'var(--radius-md)',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={15}
            className="flex-shrink-0"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
};
