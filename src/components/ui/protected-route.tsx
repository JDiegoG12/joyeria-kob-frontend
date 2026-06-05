/**
 * @file protected-route.tsx
 * @description Guardián de rutas privadas. Verifica que el usuario esté
 * autenticado y tenga el rol requerido antes de renderizar el contenido.
 *
 * ## Comportamiento
 * | Situación                        | Resultado                        |
 * |----------------------------------|----------------------------------|
 * | Sin sesión activa                | Redirige a `/login`              |
 * | Sesión activa pero rol incorrecto| Redirige a `/catalogo`           |
 * | Sesión activa y rol correcto     | Renderiza `children`             |
 *
 * ## Uso en el router
 * Se aplica a nivel de layout en `src/router/index.tsx`, por lo que
 * protege automáticamente todas las rutas hijas de `AdminLayout`:
 *
 * ```tsx
 * // router/index.tsx
 * {
 *   element: (
 *     <ProtectedRoute requiredRole="ADMIN">
 *       <AdminLayout />
 *     </ProtectedRoute>
 *   ),
 *   children: [
 *     { path: '/admin/joyas', element: <AdminJewelryPage /> },
 *   ],
 * }
 * ```
 *
 * ## Uso con roles futuros
 * Si en el futuro se agrega el rol `CLIENT` con rutas propias,
 * basta con envolver su layout con `<ProtectedRoute requiredRole="CLIENT">`.
 *
 * ```tsx
 * <ProtectedRoute requiredRole="CLIENT">
 *   <ClientLayout />
 * </ProtectedRoute>
 * ```
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/features/auth/types/auth.types';

interface ProtectedRouteProps {
  /**
   * Contenido a renderizar si el acceso es permitido.
   * Normalmente es un componente de layout (`AdminLayout`).
   */
  children: ReactNode;
  /**
   * Rol que debe tener el usuario para acceder.
   * Si se omite, solo se verifica que haya sesión activa.
   */
  requiredRole?: UserRole;
}

/**
 * Componente guardián de rutas protegidas.
 *
 * Consulta el `auth.store` para verificar si hay sesión activa
 * y si el usuario cumple con el rol requerido.
 * En caso contrario, redirige sin renderizar el contenido protegido.
 *
 * @param children - Contenido a proteger.
 * @param requiredRole - Rol necesario para acceder a la ruta.
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole } = useAuthStore();

  // Sin sesión activa → siempre va al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Con sesión pero sin el rol requerido → regresa al catálogo público
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/catalogo" replace />;
  }

  return <>{children}</>;
};