/**
 * @file protected-route.tsx
 * @description Guardián de rutas privadas. Verifica que el usuario esté
 * autenticado y tenga el rol requerido antes de renderizar el contenido.
 *
 * ## Comportamiento
 * | Situación                         | Resultado               |
 * |-----------------------------------|--------------------------|
 * | Sin token                         | Redirige a `/login`      |
 * | Token expirado o inválido         | Hace logout automático   |
 * | Rol incorrecto                    | Redirige a `/catalogo`   |
 * | Sesión válida + rol correcto      | Renderiza contenido      |
 *
 * ## Importante
 * La validación de autenticación NO depende únicamente del store.
 * También valida el JWT real mediante `AuthService.isAuthenticated()`
 * para detectar:
 *
 * - tokens expirados
 * - sesiones corruptas
 * - tokens inválidos
 * - manipulación manual del localStorage
 *
 * ## Uso en router
 *
 * ```tsx
 * {
 *   element: (
 *     <ProtectedRoute requiredRole="ADMIN">
 *       <AdminLayout />
 *     </ProtectedRoute>
 *   ),
 * }
 * ```
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/store/auth.store';
import { AuthService } from '@/features/auth/services/auth.service';

import type { UserRole } from '@/features/auth/types/auth.types';

interface ProtectedRouteProps {
  /**
   * Contenido protegido.
   * Normalmente un layout o página privada.
   */
  children: ReactNode;

  /**
   * Rol requerido para acceder.
   * Si no se especifica, solo valida sesión.
   */
  requiredRole?: UserRole;
}

/**
 * Componente guardián de rutas privadas.
 *
 * Verifica:
 * 1. Que exista un token válido
 * 2. Que el token NO esté expirado
 * 3. Que el usuario tenga el rol requerido
 *
 * Si alguna validación falla:
 * - redirige automáticamente
 * - evita renderizar contenido protegido
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  /**
   * El store solo se usa para validar roles.
   * La autenticación real vive en AuthService.
   */
  const { hasRole } = useAuthStore();

  /**
   * Verificación REAL de sesión:
   * - token existente
   * - token válido
   * - token no expirado
   */
  const isAuthenticated =
    AuthService.isAuthenticated();

  //  Usuario no autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado pero sin permisos
  if (
    requiredRole &&
    !hasRole(requiredRole)
  ) {
    return (
      <Navigate
        to="/catalogo"
        replace
      />
    );
  }

  // ✅ Acceso permitido
  return <>{children}</>;
};