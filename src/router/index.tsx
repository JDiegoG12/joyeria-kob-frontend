/**
 * @file index.tsx
 * @description Configuración central del enrutador de la aplicación Joyería KOB.
 *
 * ## Estructura de rutas
 * ```
 * /                          → Redirige automáticamente a /catalogo
 * /catalogo                  → Catálogo público de joyas (MainLayout)
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
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/auth-layout';
import { MainLayout } from '@/layouts/main-layout';
import { AdminLayout } from '@/layouts/admin-layout';
import { ProtectedRoute } from '@/components/ui/protected-route';

import { HomePage } from '@/features/catalog/pages/home-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { AdminLoginPage } from '@/features/auth/pages/admin-login-page';
import { AdminJewelryPage } from '@/features/catalog/pages/admin-jewelry-page';
import { AdminGeneralPage } from '@/features/general/pages/admin-general-page';
import { NotFoundPage } from '@/features/shared/pages/not-found-page';
import { PlaceholderPage } from '@/features/shared/pages/placeholder-page';
import { AdminCategoriesPage } from '@/features/categories/pages/admin-categories-page';
import { AdminMetricsPage } from '@/features/metrics/pages/admin-metrics-page';

/**
 * Instancia del enrutador principal de la aplicación.
 * Usa `createBrowserRouter` para soporte de rutas anidadas y layouts compartidos.
 *
 * @see {@link https://reactrouter.com/en/main/routers/create-browser-router}
 */
export const router = createBrowserRouter([
  // ─── Ruta raíz ────────────────────────────────────────────────────────────
  {
    path: '/',
    element: <Navigate to="/catalogo" replace />,
  },

  // ─── Rutas públicas con MainLayout (Navbar + Footer) ─────────────────────
  {
    element: <MainLayout />,
    children: [
      {
        path: '/catalogo',
        element: <HomePage />,
      },
    ],
  },

  // ─── Rutas de autenticación SIN MainLayout ───────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/registro',
        element: <RegisterPage />,
      },
      {
        path: '/admin/login',
        element: <AdminLoginPage />,
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
        element: <AdminGeneralPage />,
      },
      {
        path: '/admin/metricas',
        element: <AdminMetricsPage />,
      },
      {
        path: '/admin/joyas',
        element: <AdminJewelryPage />,
      },
      {
        path: '/admin/categorias',
        element: <AdminCategoriesPage />,
      },
      {
        path: '/admin/clientes',
        element: <PlaceholderPage title="Clientes" />,
      },
      {
        path: '/admin/disenos',
        element: <PlaceholderPage title="Diseños" />,
      },
      {
        path: '/admin/promociones',
        element: <PlaceholderPage title="Promociones" />,
      },
    ],
  },

  // ─── Ruta 404 — captura cualquier ruta no definida ───────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
