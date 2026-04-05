/**
 * @file index.tsx
 * @description Configuración central del enrutador de la aplicación Joyería KOB.
 *
 * ## Estructura de rutas
 * ```
 * /                          → Redirige automáticamente a /catalogo
 * /catalogo                  → Catálogo público de joyas (MainLayout)
 * /login                     → Inicio de sesión (MainLayout)
 * /admin                     → Redirige a /admin/joyas
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
 * - Rutas públicas → dentro del bloque `element: <MainLayout />`
 * - Rutas admin    → dentro del bloque `element: <ProtectedRoute><AdminLayout /></ProtectedRoute>`
 *
 * Poner una ruta admin dentro de MainLayout hace que el sidebar admin
 * nunca aparezca y que la protección por rol no funcione.
 *
 * ## Cómo agregar una nueva ruta pública
 * ```tsx
 * { path: '/nueva-ruta', element: <NuevaPage /> }
 * ```
 * Agrégala dentro del objeto que tiene `element: <MainLayout />`.
 *
 * ## Cómo agregar una nueva ruta protegida de admin
 * ```tsx
 * { path: '/admin/nueva-seccion', element: <NuevaAdminPage /> }
 * ```
 * Agrégala dentro del objeto que tiene `element: <AdminLayout />`.
 * La protección por rol ya está aplicada en ese nivel.
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';

import { MainLayout } from '@/layouts/main-layout';
import { AdminLayout } from '@/layouts/admin-layout';
import { ProtectedRoute } from '@/components/ui/protected-route';

import { HomePage } from '@/features/catalog/pages/home-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { AdminJewelryPage } from '@/features/catalog/pages/admin-jewelry-page';
import { NotFoundPage } from '@/features/shared/pages/not-found-page';
import { PlaceholderPage } from '@/features/shared/pages/placeholder-page';

/**
 * Instancia del enrutador principal de la aplicación.
 * Usa `createBrowserRouter` para soporte de rutas anidadas y layouts compartidos.
 *
 * @see {@link https://reactrouter.com/en/main/routers/create-browser-router}
 */
export const router = createBrowserRouter([
  // ─── Rutas públicas — usan MainLayout (Navbar + Footer) ──────────────────
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/catalogo" replace />,
      },
      {
        path: '/catalogo',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
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
        path: '/admin/metricas',
        element: <PlaceholderPage title="Métricas" />,
      },
      {
        path: '/admin/joyas',
        element: <AdminJewelryPage />,
      },
      {
        path: '/admin/categorias',
        element: <PlaceholderPage title="Categorías" />,
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
