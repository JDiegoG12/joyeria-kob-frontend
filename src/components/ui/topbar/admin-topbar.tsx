/**
 * @file admin-topbar.tsx
 * @description Barra superior fija del panel de administración de Joyería KOB.
 *
 * ## Contenido (de izquierda a derecha)
 * - **Botón hamburguesa** — abre el cajón del sidebar en móvil/tablet
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
 *   onOpenSidebar={() => setSidebarOpen(true)}
 *   onToggleCollapse={() => setCollapsed(prev => !prev)}
 *   isCollapsed={collapsed}
 * />
 * ```
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
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
  '/admin/metricas': 'Métricas',
  '/admin/joyas': 'Gestión de Joyas',
  '/admin/categorias': 'Gestión de Categorías',
  '/admin/clientes': 'Clientes',
  '/admin/disenos': 'Diseños',
  '/admin/promociones': 'Promociones',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminTopbarProps {
  /** Abre el cajón del sidebar en móvil/tablet. */
  onOpenSidebar: () => void;
  /** Colapsa o expande el sidebar en desktop. */
  onToggleCollapse: () => void;
  /** Estado actual del sidebar para mostrar el ícono correcto. */
  isCollapsed: boolean;
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Topbar fijo del panel de administración.
 * Lee la ruta activa para mostrar el nombre de la sección actual.
 */
export const AdminTopbar = ({
  onOpenSidebar,
  onToggleCollapse,
  isCollapsed,
}: AdminTopbarProps) => {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();

  /** Título de la sección activa. Fallback a 'Panel Admin' si no está mapeada. */
  const sectionLabel = SECTION_LABELS[pathname] ?? 'Panel Admin';

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 flex items-center gap-3 px-4"
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* ── Izquierda: controles del sidebar + nombre de sección ─────────────── */}
      <div className="flex flex-1 items-center gap-2">
        {/* Hamburguesa — solo móvil/tablet */}
        <button
          onClick={onOpenSidebar}
          className="rounded-md p-2 transition-colors lg:hidden"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        {/* Botón colapsar sidebar — solo desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden rounded-md p-2 transition-colors lg:flex"
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
          className="truncate"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            // Sobreescribe el h1 global de tokens.css para el topbar
            lineHeight: 1,
          }}
        >
          {sectionLabel}
        </h1>
      </div>

      {/* ── Derecha: acciones globales ───────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 transition-colors"
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
          className="hidden items-center gap-2 rounded-md px-3 py-2 transition-colors sm:flex"
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
          className="flex rounded-md p-2 transition-colors sm:hidden"
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
    <div className="relative ml-1">
      {/* Botón avatar */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
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
          className="hidden text-sm sm:block"
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
            className="absolute right-0 z-50 mt-2 w-56 rounded-lg py-1"
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
  icon: React.ElementType;
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
    className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors"
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
