/**
 * @file admin-topbar.tsx
 * @description Barra superior fija del panel de administración de Joyería KOB.
 *
 * ## Contenido (de izquierda a derecha)
 * - **Botón hamburguesa/X** — toggle del cajón del sidebar en móvil/tablet.
 *   Muestra ≡ cuando está cerrado y ✕ cuando está abierto.
 * - **Botón colapsar** — colapsa el sidebar a solo íconos en desktop
 * - **Nombre de sección** — muestra el título de la ruta activa actual
 * - **Toggle de tema** — alterna entre modo claro y oscuro
 * - **Botón "Ver catálogo"** — navega a `/catalogo` en el layout público
 * - **Avatar de usuario** — muestra nombre y dropdown con opciones de sesión
 *
 * ## Nombre de sección
 * Se deriva automáticamente de la ruta activa usando `useLocation` y el
 * mapa `SECTION_LABELS`. Al agregar una nueva ruta admin, agrégala también
 * a ese mapa para que el título aparezca correctamente.
 *
 * ## Posicionamiento
 * `fixed` en `top: 0` con `z-50`, siempre por encima del sidebar (`z-40`)
 * y del contenido. El `AdminLayout` compensa con `paddingTop: topbar-height`.
 *
 * ## Uso
 * Se monta desde `AdminLayout`. No se usa en ningún otro lugar.
 * ```tsx
 * <AdminTopbar
 *   onToggleSidebar={() => setSidebarOpen(prev => !prev)}
 *   isSidebarOpen={sidebarOpen}
 *   onToggleCollapse={() => setCollapsed(prev => !prev)}
 *   isCollapsed={collapsed}
 * />
 * ```
 */

import { useState, type ElementType } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  ShoppingBag,
  LogOut,
  User,
} from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';
import { useAuthStore } from '@/store/auth.store';
import { AuthService } from '@/features/auth/services/auth.service';

// ─── Mapa de títulos por ruta ─────────────────────────────────────────────────

/**
 * Relación entre rutas admin y el nombre que se muestra en el topbar.
 * Agregar aquí cada nueva ruta de administración que se cree.
 */
const SECTION_LABELS: Record<string, string> = {
  '/admin/general': 'Configuración General',
  '/admin/metricas': 'Métricas',
  '/admin/joyas': 'Gestión de Joyas',
  '/admin/categorias': 'Gestión de Categorías',
  '/admin/clientes': 'Clientes',
  '/admin/disenos': 'Diseños',
  '/admin/promociones': 'Promociones',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminTopbarProps {
  /**
   * Toggle del cajón del sidebar en móvil/tablet.
   * Abre si está cerrado, cierra si está abierto.
   */
  onToggleSidebar: () => void;
  /** Estado actual del sidebar móvil — determina el ícono (≡ o ✕). */
  isSidebarOpen: boolean;
  /** Colapsa o expande el sidebar en desktop. */
  onToggleCollapse: () => void;
  /** Estado actual del sidebar para mostrar el ícono correcto. */
  isCollapsed: boolean;
  /** Espacio ocupado por el sidebar en desktop para alinear la barra superior. */
  sidebarOffset: string | number;
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Topbar fijo del panel de administración.
 * Lee la ruta activa para mostrar el nombre de la sección actual.
 */
export const AdminTopbar = ({
  onToggleSidebar,
  isSidebarOpen,
  onToggleCollapse,
  isCollapsed,
  sidebarOffset,
}: AdminTopbarProps) => {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();

  /** Título de la sección activa. Fallback a 'Panel Admin' si no está mapeada. */
  const sectionLabel = SECTION_LABELS[pathname] ?? 'Panel Admin';

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 flex min-w-0 items-center gap-3 px-3 transition-all duration-300 ease-in-out sm:px-4 lg:px-6"
      style={{
        height: 'var(--topbar-height)',
        left: sidebarOffset,
        backgroundColor: 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* ── Izquierda: controles del sidebar + nombre de sección ─────────────── */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Toggle sidebar — solo móvil/tablet. Alterna entre ≡ y ✕ */}
        <button
          onClick={onToggleSidebar}
          className="cursor-pointer rounded-md p-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:hidden"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Botón colapsar sidebar — solo desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden cursor-pointer rounded-md p-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] lg:flex"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>

        {/* Separador vertical */}
        <div
          className="hidden h-5 w-px lg:block"
          style={{ backgroundColor: 'var(--border-color)' }}
        />

        {/* Nombre de la sección activa */}
        <h1
          className="min-w-0 truncate text-[var(--text-base)] sm:text-[var(--text-xl)]"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 1,
          }}
        >
          {sectionLabel}
        </h1>
      </div>

      {/* ── Derecha: acciones globales ───────────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className="cursor-pointer rounded-md p-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={
            theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'
          }
          title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        >
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        {/* Botón ver catálogo público */}
        <Link
          to="/catalogo"
          className="hidden items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:flex"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
          }}
          title="Ir al catálogo público"
        >
          <ShoppingBag size={16} />
          <span>Ver catálogo</span>
        </Link>

        {/* Versión ícono del botón catálogo — solo móvil */}
        <Link
          to="/catalogo"
          className="flex rounded-md p-2 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:hidden"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Ver catálogo público"
        >
          <ShoppingBag size={19} />
        </Link>

        {/* Avatar de usuario con dropdown */}
        {user && <UserMenu name={user.name} email={user.email} />}
      </div>
    </header>
  );
};

// ─── Subcomponente: menú de usuario ──────────────────────────────────────────

interface UserMenuProps {
  name: string;
  email: string;
}

/**
 * Avatar del usuario autenticado con dropdown de opciones.
 * Muestra inicial del nombre como avatar circular.
 * Opciones: ver perfil, cerrar sesión.
 *
 * @internal Solo se usa dentro de `AdminTopbar`.
 */
const UserMenu = ({ name, email }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const firstName = name.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  return (
    <div className="relative ml-0 sm:ml-1">
      {/* Botón avatar */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-2"
        style={{
          backgroundColor: open ? 'var(--bg-hover)' : 'transparent',
        }}
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        {/* Círculo con inicial */}
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-bold)',
          }}
        >
          {initial}
        </span>

        {/* Nombre — oculto en móvil muy pequeño */}
        <span
          className="hidden max-w-24 truncate text-sm sm:block"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
          }}
        >
          {firstName}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Cierra al hacer clic fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            className="absolute right-0 z-50 mt-2 w-56 max-w-[calc(100vw-1rem)] rounded-lg py-1"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Info del usuario */}
            <div
              className="px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                }}
              >
                {name}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                }}
              >
                {email}
              </p>
            </div>

            {/* Opciones */}
            <div className="py-1">
              <DropdownButton
                icon={User}
                label="Mi perfil"
                onClick={() => {
                  setOpen(false);
                  navigate('/admin/perfil');
                }}
              />
              <DropdownButton
                icon={LogOut}
                label="Cerrar sesión"
                onClick={handleLogout}
                danger
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Subcomponente: botón de dropdown ────────────────────────────────────────

interface DropdownButtonProps {
  icon: ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

/**
 * Botón de opción dentro del dropdown de usuario.
 * @internal Solo se usa dentro de `UserMenu`.
 */
const DropdownButton = ({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: DropdownButtonProps) => (
  <button
    onClick={onClick}
    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      color: danger ? 'var(--color-error)' : 'var(--text-secondary)',
      textAlign: 'left',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor =
        'var(--bg-hover)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
    }}
  >
    <Icon size={16} style={{ flexShrink: 0 }} />
    {label}
  </button>
);
