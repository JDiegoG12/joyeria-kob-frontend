/**
 * @file index.tsx
 * @description Configuración central del enrutador de la aplicación Joyería KOB.
 *
 * ## Estructura de rutas
 * ```
 * /                          → Página principal pública (MainLayout)
 * /catalogo                  → Catálogo público de joyas (MainLayout)
 * /favoritos                 → Placeholder de favoritos (MainLayout)
 * /login                     → Inicio de sesión cliente (sin MainLayout)
 * /registro                  → Registro de cliente (sin MainLayout)
 * /admin/login               → Inicio de sesión administrador (sin MainLayout)
 * /admin                     → Redirige a /admin/joyas
 * /admin/general             → Configuración general (AdminLayout + ProtectedRoute ADMIN)
 * /admin/metricas            → Métricas (AdminLayout + ProtectedRoute ADMIN)
 * /admin/joyas               → CRUD de joyas (AdminLayout + ProtectedRoute ADMIN)
 * /admin/categorias          → Gestión de categorías (AdminLayout + ProtectedRoute ADMIN)
 * /admin/clientes            → Gestión de clientes (AdminLayout + ProtectedRoute ADMIN)
 * /admin/disenos             → Gestión de diseños (AdminLayout + ProtectedRoute ADMIN)
 * /admin/promociones         → Gestión de promociones (AdminLayout + ProtectedRoute ADMIN)
 * *                          → Página 404
 * ```
 *
 * ## Regla fundamental de este archivo
 * Cada ruta debe vivir en el bloque del layout que le corresponde:
 * - Rutas públicas con navegación general → dentro del bloque `element: <MainLayout />`
 * - Rutas de autenticación → fuera de `MainLayout` para evitar navbar/footer
 * - Rutas admin protegidas → dentro del bloque `element: <ProtectedRoute><AdminLayout /></ProtectedRoute>`
 *
 * Poner una ruta admin dentro de MainLayout hace que el sidebar admin
 * nunca aparezca y que la protección por rol no funcione.
 *
 * ## Code splitting con lazy loading
 * Todas las páginas se cargan con `React.lazy()` + `Suspense` para que Vite
 * genere un chunk JS independiente por ruta. El navegador descarga cada chunk
 * solo cuando el usuario navega a esa ruta por primera vez; las visitas
 * siguientes usan la caché del navegador.
 *
 * Patrón utilizado en cada import:
 * ```ts
 * const MiPagina = lazy(() =>
 *   import('@/features/.../mi-pagina').then(m => ({ default: m.MiPagina }))
 * );
 * ```
 * El `.then(m => ({ default: m.MiPagina }))` es necesario porque los módulos
 * exportan named exports, no default exports, y `React.lazy` solo admite
 * default exports.
 *
 * ## Layouts: NO se cargan con lazy
 * `MainLayout`, `AdminLayout` y `AuthLayout` son shells livianos (navbar,
 * sidebar, footer). Se importan de forma estática para que estén disponibles
 * de inmediato y el Suspense spinner no aparezca sobre un layout vacío.
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthLayout } from '@/layouts/auth-layout';
import { MainLayout } from '@/layouts/main-layout';
import { AdminLayout } from '@/layouts/admin-layout';
import { ProtectedRoute } from '@/components/ui/protected-route';
import { PageLoader } from '@/features/shared/pages/page-loader';

// ─── Páginas públicas ─────────────────────────────────────────────────────────
// Chunk: página principal de marca, independiente del catálogo.
const HomePage = lazy(() =>
  import('@/features/home/pages/home-page').then((m) => ({
    default: m.HomePage,
  })),
);

// Chunk: catálogo público con productos y filtros.
const CatalogPage = lazy(() =>
  import('@/features/catalog/pages/catalog-page').then((m) => ({
    default: m.CatalogPage,
  })),
);

// ─── Páginas de autenticación ─────────────────────────────────────────────────
// Se agrupan en el mismo chunk porque se usan en flujos consecutivos
// (el usuario pasa de login a registro en la misma sesión).
const LoginPage = lazy(() =>
  import('@/features/auth/pages/login-page').then((m) => ({
    default: m.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/register-page').then((m) => ({
    default: m.RegisterPage,
  })),
);
const AdminLoginPage = lazy(() =>
  import('@/features/auth/pages/admin-login-page').then((m) => ({
    default: m.AdminLoginPage,
  })),
);

// ─── Páginas de administración ────────────────────────────────────────────────
// Cada página admin es un chunk separado. El panel de métricas (Recharts)
// es especialmente pesado y se beneficia mucho de cargarse bajo demanda.
const AdminGeneralPage = lazy(() =>
  import('@/features/general/pages/admin-general-page').then((m) => ({
    default: m.AdminGeneralPage,
  })),
);
const AdminMetricsPage = lazy(() =>
  import('@/features/metrics/pages/admin-metrics-page').then((m) => ({
    default: m.AdminMetricsPage,
  })),
);
const AdminJewelryPage = lazy(() =>
  import('@/features/catalog/pages/admin-jewelry-page').then((m) => ({
    default: m.AdminJewelryPage,
  })),
);
const AdminCategoriesPage = lazy(() =>
  import('@/features/categories/pages/admin-categories-page').then((m) => ({
    default: m.AdminCategoriesPage,
  })),
);

// ─── Páginas compartidas ──────────────────────────────────────────────────────
const NotFoundPage = lazy(() =>
  import('@/features/shared/pages/not-found-page').then((m) => ({
    default: m.NotFoundPage,
  })),
);
const PlaceholderPage = lazy(() =>
  import('@/features/shared/pages/placeholder-page').then((m) => ({
    default: m.PlaceholderPage,
  })),
);

// ─── Helper: envuelve un elemento en Suspense con el spinner global ───────────
/**
 * Envuelve `element` en un `<Suspense>` con el `<PageLoader>` como fallback.
 * Úsalo en cada `element` de ruta para evitar repetir el boilerplate.
 *
 * @param element - El componente de página cargado con `React.lazy`.
 * @returns El mismo elemento envuelto en `<Suspense>`.
 */
const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

/**
 * Instancia del enrutador principal de la aplicación.
 * Usa `createBrowserRouter` para soporte de rutas anidadas y layouts compartidos.
 *
 * @see {@link https://reactrouter.com/en/main/routers/create-browser-router}
 */
export const router = createBrowserRouter([
  // ─── Rutas públicas con MainLayout (Navbar + Footer) ─────────────────────
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: withSuspense(<HomePage />),
      },
      {
        path: '/catalogo',
        element: withSuspense(<CatalogPage />),
      },
      {
        path: '/favoritos',
        element: withSuspense(<PlaceholderPage title="Favoritos" />),
      },
    ],
  },

  // ─── Rutas de autenticación SIN MainLayout ───────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: withSuspense(<LoginPage />),
      },
      {
        path: '/registro',
        element: withSuspense(<RegisterPage />),
      },
      {
        path: '/admin/login',
        element: withSuspense(<AdminLoginPage />),
      },
    ],
  },

  // ─── Rutas protegidas de administración — usan AdminLayout ───────────────
  //
  // ProtectedRoute verifica que haya sesión activa y rol ADMIN.
  // Si no hay sesión → redirige a /login.
  // Si hay sesión pero no es ADMIN → redirige a /catalogo.
  // Todas las rutas /admin/* deben vivir aquí, nunca en el bloque público.
  {
    element: (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/admin',
        element: <Navigate to="/admin/joyas" replace />,
      },
      {
        path: '/admin/general',
        element: withSuspense(<AdminGeneralPage />),
      },
      {
        path: '/admin/metricas',
        // Recharts se descarga SOLO si el admin visita esta ruta.
        element: withSuspense(<AdminMetricsPage />),
      },
      {
        path: '/admin/joyas',
        element: withSuspense(<AdminJewelryPage />),
      },
      {
        path: '/admin/categorias',
        element: withSuspense(<AdminCategoriesPage />),
      },
      {
        path: '/admin/clientes',
        element: withSuspense(<PlaceholderPage title="Clientes" />),
      },
      {
        path: '/admin/disenos',
        element: withSuspense(<PlaceholderPage title="Diseños" />),
      },
      {
        path: '/admin/promociones',
        element: withSuspense(<PlaceholderPage title="Promociones" />),
      },
    ],
  },

  // ─── Ruta 404 — captura cualquier ruta no definida ───────────────────────
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
  },
]);
