/**
 * @file favorite.store.test.ts
 * @description Tests del store de favoritos: optimistic update, reconciliación
 * del POST sin `product`, rama 409 (FIX del doble click), revert en error y
 * limpieza con fallo parcial. Es la lógica de negocio más delicada del front.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFavoriteStore } from './favorite.store';
import { favoriteService } from '../services/favorite.service';
import type { FavoriteItem } from '../types/favorite.types';
import type { Product } from '@/features/catalog/types/product.types';

vi.mock('../services/favorite.service', () => ({
  favoriteService: {
    getAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const mockedService = vi.mocked(favoriteService);

/** Crea un FavoriteItem válido (con producto) para los tests. */
const makeFavorite = (productId: string, id = 1): FavoriteItem => ({
  id,
  userId: 'u1',
  productId,
  createdAt: '2026-06-08T00:00:00.000Z',
  product: { id: productId, name: productId, images: [] } as unknown as Product,
});

/** Estado base del store, restaurado antes de cada test. */
const resetStore = () =>
  useFavoriteStore.setState({
    favorites: [],
    favoriteIds: new Set<string>(),
    loading: false,
    loaded: false,
  });

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

describe('loadFavorites', () => {
  it('carga, sanea y construye el Set de IDs', async () => {
    mockedService.getAll.mockResolvedValue([
      makeFavorite('p1'),
      makeFavorite('p2'),
    ]);

    await useFavoriteStore.getState().loadFavorites();

    const state = useFavoriteStore.getState();
    expect(state.favorites).toHaveLength(2);
    expect(state.favoriteIds.has('p1')).toBe(true);
    expect(state.favoriteIds.has('p2')).toBe(true);
    expect(state.loaded).toBe(true);
  });

  it('descarta items corruptos (sin product o sin product.id)', async () => {
    mockedService.getAll.mockResolvedValue([
      makeFavorite('ok'),
      null,
      { id: 2, userId: 'u', productId: 'x', createdAt: '' },
      { id: 3, userId: 'u', productId: 'y', createdAt: '', product: {} },
    ] as unknown as FavoriteItem[]);

    await useFavoriteStore.getState().loadFavorites();

    const state = useFavoriteStore.getState();
    expect(state.favorites).toHaveLength(1);
    expect(state.favorites[0].productId).toBe('ok');
  });

  it('no recarga si ya está cargado y no se fuerza', async () => {
    useFavoriteStore.setState({ loaded: true });
    await useFavoriteStore.getState().loadFavorites();
    expect(mockedService.getAll).not.toHaveBeenCalled();
  });

  it('recarga cuando se fuerza aunque esté cargado', async () => {
    useFavoriteStore.setState({ loaded: true });
    mockedService.getAll.mockResolvedValue([]);
    await useFavoriteStore.getState().loadFavorites(true);
    expect(mockedService.getAll).toHaveBeenCalledOnce();
  });
});

describe('addFavorite', () => {
  it('agrega de forma optimista y reconcilia el id real del POST (sin product)', async () => {
    mockedService.add.mockResolvedValue({
      id: 99,
      userId: 'u1',
      productId: 'p1',
      createdAt: '2026-06-09T00:00:00.000Z',
    });

    const result = await useFavoriteStore.getState().addFavorite('p1');

    const state = useFavoriteStore.getState();
    expect(result).toBe(true);
    expect(state.favoriteIds.has('p1')).toBe(true);
    expect(state.favorites).toHaveLength(1);
    // El item optimista (id: -1) quedó reconciliado con el id real del backend.
    expect(state.favorites[0].id).toBe(99);
  });

  it('no duplica si el producto ya está en favoritos', async () => {
    useFavoriteStore.setState({ favoriteIds: new Set(['p1']) });

    const result = await useFavoriteStore.getState().addFavorite('p1');

    expect(result).toBe(false);
    expect(mockedService.add).not.toHaveBeenCalled();
  });

  it('revierte el optimistic update ante un error genérico (no 409)', async () => {
    mockedService.add.mockRejectedValue({ response: { status: 500 } });

    const result = await useFavoriteStore.getState().addFavorite('p1');

    const state = useFavoriteStore.getState();
    expect(result).toBe(false);
    expect(state.favoriteIds.has('p1')).toBe(false);
    expect(state.favorites).toHaveLength(0);
    expect(mockedService.getAll).not.toHaveBeenCalled();
  });

  it('ante un 409 revierte y resincroniza con el servidor (FIX doble click)', async () => {
    mockedService.add.mockRejectedValue({ response: { status: 409 } });
    mockedService.getAll.mockResolvedValue([makeFavorite('p1', 7)]);

    const result = await useFavoriteStore.getState().addFavorite('p1');

    const state = useFavoriteStore.getState();
    expect(result).toBe(false);
    // loadFavorites(true) trae la verdad del servidor: el favorito sí existe.
    expect(mockedService.getAll).toHaveBeenCalledOnce();
    expect(state.favoriteIds.has('p1')).toBe(true);
  });
});

describe('removeFavorite', () => {
  it('elimina de forma optimista', async () => {
    useFavoriteStore.setState({
      favorites: [makeFavorite('p1'), makeFavorite('p2')],
      favoriteIds: new Set(['p1', 'p2']),
    });
    mockedService.remove.mockResolvedValue(undefined);

    await useFavoriteStore.getState().removeFavorite('p1');

    const state = useFavoriteStore.getState();
    expect(state.favoriteIds.has('p1')).toBe(false);
    expect(state.favorites.map((f) => f.productId)).toEqual(['p2']);
  });

  it('revierte si el backend falla', async () => {
    const initial = [makeFavorite('p1')];
    useFavoriteStore.setState({
      favorites: initial,
      favoriteIds: new Set(['p1']),
    });
    mockedService.remove.mockRejectedValue(new Error('network'));

    await useFavoriteStore.getState().removeFavorite('p1');

    const state = useFavoriteStore.getState();
    expect(state.favoriteIds.has('p1')).toBe(true);
    expect(state.favorites).toHaveLength(1);
  });
});

describe('clearAllFavorites', () => {
  it('vacía todo cuando todas las eliminaciones tienen éxito', async () => {
    useFavoriteStore.setState({
      favorites: [makeFavorite('p1'), makeFavorite('p2')],
      favoriteIds: new Set(['p1', 'p2']),
    });
    mockedService.remove.mockResolvedValue(undefined);

    await useFavoriteStore.getState().clearAllFavorites();

    const state = useFavoriteStore.getState();
    expect(state.favorites).toHaveLength(0);
    expect(state.favoriteIds.size).toBe(0);
    expect(state.loaded).toBe(true);
    expect(mockedService.remove).toHaveBeenCalledTimes(2);
  });

  it('resincroniza con el servidor si alguna eliminación falla', async () => {
    useFavoriteStore.setState({
      favorites: [makeFavorite('p1'), makeFavorite('p2')],
      favoriteIds: new Set(['p1', 'p2']),
    });
    mockedService.remove
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fail'));
    mockedService.getAll.mockResolvedValue([makeFavorite('p2')]);

    await useFavoriteStore.getState().clearAllFavorites();

    expect(mockedService.getAll).toHaveBeenCalledOnce();
  });
});

describe('helpers', () => {
  it('isFavorite refleja el Set de IDs', () => {
    useFavoriteStore.setState({ favoriteIds: new Set(['p1']) });
    expect(useFavoriteStore.getState().isFavorite('p1')).toBe(true);
    expect(useFavoriteStore.getState().isFavorite('p2')).toBe(false);
  });

  it('clearFavorites resetea el store al estado inicial', () => {
    useFavoriteStore.setState({
      favorites: [makeFavorite('p1')],
      favoriteIds: new Set(['p1']),
      loaded: true,
    });

    useFavoriteStore.getState().clearFavorites();

    const state = useFavoriteStore.getState();
    expect(state.favorites).toHaveLength(0);
    expect(state.favoriteIds.size).toBe(0);
    expect(state.loaded).toBe(false);
  });
});
