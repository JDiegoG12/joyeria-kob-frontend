/**
 * @file index.tsx
 * @description Configuración central del enrutador de la aplicación Joyería KOB.
 *
 * ## Estructura de rutas
 * ```
 * /                        → Redirige automáticamente a /catalogo
 * /catalogo                → Catálogo público de joyas (MainLayout)
 * /login                   → Inicio de sesión (sin layout)
 * /admin                   → Redirige a /admin/joyas
 * /admin/joyas             → CRUD de joyas (AdminLayout + ProtectedRoute)
 * *                        → Página 404
 * ```
 *
 * ## Cómo agregar una nueva ruta pública
 * ```tsx
 * {
 *   path: 'nueva-ruta',
 *   element: <NuevaPage />,
 * }
 * ```
 * Agrégala dentro del objeto que tiene `element: <MainLayout />`.
 *
 * ## Cómo agregar una nueva ruta protegida de admin
 * ```tsx
 * {
 *   path: 'nueva-seccion',
 *   element: <NuevaAdminPage />,
 * }
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

/**
 * Instancia del enrutador principal de la aplicación.
 * Usa `createBrowserRouter` para soporte de rutas anidadas y layouts compartidos.
 *
 * @see {@link https://reactrouter.com/en/main/routers/create-browser-router}
 */
export const router = createBrowserRouter([
  // ─── Rutas públicas (con Navbar y Footer) ────────────────────────────────
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

  // ─── Rutas protegidas de administración ──────────────────────────────────
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
        path: '/admin/joyas',
        element: <AdminJewelryPage />,
      },
    ],
  },

  // ─── Ruta 404 ─────────────────────────────────────────────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);