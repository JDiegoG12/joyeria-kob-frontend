/**
 * @file use-favorite-action.test.ts
 * @description Tests del hook de acción de favoritos: gating por autenticación
 * (abre el modal si no hay sesión) y toggle add/remove según el estado actual.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavoriteAction } from './use-favorite-action';
import { favoriteService } from '../services/favorite.service';
import { useFavoriteStore } from '../store/favorite.store';
import { useAuthStore } from '@/store/auth.store';
import { useAuthPromptStore } from '@/store/auth-prompt.store';
import type { FavoriteItem } from '../types/favorite.types';
import type { Product } from '@/features/catalog/types/product.types';

vi.mock('../services/favorite.service', () => ({
  favoriteService: { getAll: vi.fn(), add: vi.fn(), remove: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const mockedService = vi.mocked(favoriteService);

const makeFavorite = (productId: string): FavoriteItem => ({
  id: 1,
  userId: 'u1',
  productId,
  createdAt: '2026-06-08T00:00:00.000Z',
  product: { id: productId, images: [] } as unknown as Product,
});

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  useAuthPromptStore.setState({ isOpen: false });
  useFavoriteStore.setState({
    favorites: [],
    favoriteIds: new Set<string>(),
    loading: false,
    loaded: false,
  });
});

describe('useFavoriteAction', () => {
  it('sin sesión, toggle abre el modal de login y no muta favoritos', async () => {
    const { result } = renderHook(() => useFavoriteAction('p1'));

    await act(async () => {
      await result.current.toggle();
    });

    expect(useAuthPromptStore.getState().isOpen).toBe(true);
    expect(mockedService.add).not.toHaveBeenCalled();
  });

  it('con sesión y producto no favorito, toggle lo agrega', async () => {
    useAuthStore.setState({ isAuthenticated: true });
    mockedService.add.mockResolvedValue({
      id: 9,
      userId: 'u1',
      productId: 'p1',
      createdAt: 'x',
    });

    const { result } = renderHook(() => useFavoriteAction('p1'));

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockedService.add).toHaveBeenCalledWith('p1');
    expect(mockedService.remove).not.toHaveBeenCalled();
  });

  it('con sesión y producto ya favorito, toggle lo elimina', async () => {
    useAuthStore.setState({ isAuthenticated: true });
    useFavoriteStore.setState({
      favorites: [makeFavorite('p1')],
      favoriteIds: new Set(['p1']),
    });
    mockedService.remove.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFavoriteAction('p1'));
    expect(result.current.isFavorite).toBe(true);

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockedService.remove).toHaveBeenCalledWith('p1');
    expect(mockedService.add).not.toHaveBeenCalled();
  });

  it('isFavorite refleja reactivamente el store', () => {
    const { result, rerender } = renderHook(() => useFavoriteAction('p1'));
    expect(result.current.isFavorite).toBe(false);

    act(() => {
      useFavoriteStore.setState({ favoriteIds: new Set(['p1']) });
    });
    rerender();

    expect(result.current.isFavorite).toBe(true);
  });
});
