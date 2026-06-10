/**
 * @file auth.service.test.ts
 * @description Tests del servicio de autenticación: login (persistencia y
 * manejo de errores) y validación local de la sesión (`isAuthenticated`).
 *
 * Se mockean `apiClient` y `useAuthStore`; `getApiErrorMessage` se deja real
 * para validar la cadena de mensajes de error de extremo a extremo.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/api/api-client';
import { AuthService } from './auth.service';

// Estado mutable del store de auth, compartido con el mock (hoisted).
const authState = vi.hoisted(() => ({
  token: null as string | null,
  user: null as { role?: string } | null,
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock('@/api/api-client', () => ({
  apiClient: { post: vi.fn() },
}));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: { getState: () => authState },
}));

const mockedPost = vi.mocked(apiClient.post);

/** Crea un JWT de prueba con el payload indicado (header y firma ficticios). */
const makeToken = (payload: object): string =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  authState.token = null;
  authState.user = null;
  // `isAuthenticated` llama a `AuthService.logout()` ante tokens inválidos.
  // Se espía el método (que internamente navega vía window.location) para
  // aislar la lógica de validación y evitar la navegación real de jsdom.
  vi.spyOn(AuthService, 'logout').mockImplementation(() => {});
});

describe('AuthService.login', () => {
  it('persiste la sesión cuando la respuesta es válida', async () => {
    mockedPost.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: { token: 'jwt-token', user: { id: '1', role: 'CLIENT' } },
      },
    });

    await AuthService.login({ email: 'a@b.com', password: '123' });

    expect(authState.setSession).toHaveBeenCalledWith('jwt-token', {
      id: '1',
      role: 'CLIENT',
    });
  });

  it('lanza "Respuesta inválida del servidor" si falta el token o el usuario', async () => {
    mockedPost.mockResolvedValue({
      data: { success: true, message: 'ok', data: { token: '', user: null } },
    });

    await expect(
      AuthService.login({ email: 'a@b.com', password: '123' }),
    ).rejects.toThrow('Respuesta inválida del servidor');
    expect(authState.setSession).not.toHaveBeenCalled();
  });

  it('propaga el mensaje del backend cuando el login falla', async () => {
    mockedPost.mockRejectedValue({
      response: { data: { message: 'Credenciales inválidas' } },
    });

    await expect(
      AuthService.login({ email: 'a@b.com', password: 'bad' }),
    ).rejects.toThrow('Credenciales inválidas');
  });
});

describe('AuthService.isAuthenticated', () => {
  it('devuelve false sin cerrar sesión cuando no hay token', () => {
    authState.token = null;
    expect(AuthService.isAuthenticated()).toBe(false);
    expect(AuthService.logout).not.toHaveBeenCalled();
  });

  it('devuelve true para un token válido no expirado', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    authState.token = makeToken({ exp });
    expect(AuthService.isAuthenticated()).toBe(true);
    expect(AuthService.logout).not.toHaveBeenCalled();
  });

  it('cierra sesión y devuelve false para un token mal formado (≠ 3 segmentos)', () => {
    authState.token = 'no-es-un-jwt';
    expect(AuthService.isAuthenticated()).toBe(false);
    expect(AuthService.logout).toHaveBeenCalled();
  });

  it('cierra sesión y devuelve false cuando exp no es numérico', () => {
    authState.token = makeToken({ exp: 'pronto' });
    expect(AuthService.isAuthenticated()).toBe(false);
    expect(AuthService.logout).toHaveBeenCalled();
  });

  it('cierra sesión y devuelve false para un token expirado', () => {
    const exp = Math.floor(Date.now() / 1000) - 10;
    authState.token = makeToken({ exp });
    expect(AuthService.isAuthenticated()).toBe(false);
    expect(AuthService.logout).toHaveBeenCalled();
  });
});
