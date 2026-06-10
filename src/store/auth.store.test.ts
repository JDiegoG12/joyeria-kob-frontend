/**
 * @file auth.store.test.ts
 * @description Tests del store de autenticación: setSession/clearSession
 * (incluida la limpieza de favoritos) y hasRole.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import type { AuthUser } from '@/features/auth/types/auth.types';

// Mock de la feature de favoritos: clearSession debe limpiar también favoritos.
const clearFavorites = vi.hoisted(() => vi.fn());

vi.mock('@/features/favorites', () => ({
  useFavoriteStore: { getState: () => ({ clearFavorites }) },
}));

const adminUser = { id: '1', name: 'Admin', role: 'ADMIN' } as AuthUser;

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

describe('setSession', () => {
  it('guarda token, usuario y marca la sesión como activa', () => {
    useAuthStore.getState().setSession('jwt', adminUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe('jwt');
    expect(state.user).toEqual(adminUser);
    expect(state.isAuthenticated).toBe(true);
  });
});

describe('clearSession', () => {
  it('limpia la sesión y los favoritos', () => {
    useAuthStore.getState().setSession('jwt', adminUser);

    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(clearFavorites).toHaveBeenCalledOnce();
  });
});

describe('hasRole', () => {
  it('devuelve true cuando el rol coincide', () => {
    useAuthStore.getState().setSession('jwt', adminUser);
    expect(useAuthStore.getState().hasRole('ADMIN')).toBe(true);
  });

  it('devuelve false cuando el rol no coincide o no hay usuario', () => {
    expect(useAuthStore.getState().hasRole('ADMIN')).toBe(false);
    useAuthStore.getState().setSession('jwt', adminUser);
    expect(useAuthStore.getState().hasRole('CLIENT')).toBe(false);
  });
});
