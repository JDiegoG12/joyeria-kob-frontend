/**
 * @file favorite.store.ts
 * @description Store de Zustand para la gestión global de favoritos.
 *
 * ## Contrato asimétrico del backend (clave para entender este store)
 * - `GET  /api/favorites`  → devuelve cada favorito CON el `product` anidado.
 * - `POST /api/favorites`  → devuelve el favorito "pelado" (`FavoriteRecord`:
 *   id, userId, productId, createdAt) SIN el `product`.
 *
 * Por eso `addFavorite` NO puede depender de que la respuesta del POST traiga
 * el producto. El producto completo se hidrata vía `loadFavorites(true)`
 * (p. ej. al entrar a la página de favoritos).
 *
 * ## FIX del "doble click + 409"
 * Antes, el camino de éxito de `addFavorite` exigía `newItem.product` y
 * lanzaba si faltaba. Como el POST nunca trae el producto, TODA alta válida
 * (201) se trataba como error: se revertía el optimistic update y el favorito
 * quedaba creado en la BD pero ausente en la UI (favorito "fantasma"). El
 * usuario debía pulsar de nuevo, y ese segundo POST devolvía 409 "ya existe".
 *
 * ## Optimistic update (Set + favorites[])
 * `addFavorite` actualiza TANTO `favoriteIds` (Set) COMO `favorites[]` con un
 * item temporal (`id: -1`), de modo que el corazón se active en el primer
 * click y el contador sea consistente. Cuando el POST responde (201), el item
 * optimista se confirma reconciliando los datos reales que sí llegan (`id`,
 * `createdAt`), conservando el placeholder del producto hasta la próxima carga.
 */

import { create } from 'zustand';
import { favoriteService } from '../services/favorite.service';
import type { FavoriteItem } from '../types/favorite.types';
import toast from 'react-hot-toast';

interface FavoriteState {
  favorites: FavoriteItem[];
  favoriteIds: Set<string>;
  loading: boolean;
  loaded: boolean;

  loadFavorites: (force?: boolean) => Promise<void>;
  addFavorite: (productId: string) => Promise<boolean>;
  removeFavorite: (productId: string) => Promise<void>;
  clearAllFavorites: () => Promise<void>;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

/**
 * Construye el Set de IDs SOLO con favoritos válidos.
 * Evita crashes cuando algún item venga corrupto o incompleto.
 */
const buildFavoriteIds = (favorites: FavoriteItem[]): Set<string> =>
  new Set(
    favorites
      .filter((f) => f?.productId)
      .map((f) => f.productId),
  );

/**
 * Normaliza y limpia favoritos inválidos.
 * Los items con id: -1 (optimistas) se dejan pasar — se filtran después.
 * Un producto sin imágenes es válido y se muestra con el placeholder SVG.
 */
const sanitizeFavorites = (favorites: FavoriteItem[]): FavoriteItem[] => {
  return favorites
    .filter((item) => item && item.product && item.product.id)
    .map((item) => ({
      ...item,
      product: {
        ...item.product,
        images: Array.isArray(item.product.images) ? item.product.images : [],
      },
    }));
};

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  favoriteIds: new Set(),
  loading: false,
  loaded: false,

  // ────────────────────────────────────────────────────────────────────────
  // LOAD FAVORITES
  // ────────────────────────────────────────────────────────────────────────

  loadFavorites: async (force = false) => {
    const { loaded, loading } = get();

    if ((loaded && !force) || loading) return;

    set({ loading: true });

    try {
      const response = await favoriteService.getAll();

      const favorites = sanitizeFavorites(response);

      set({
        favorites,
        favoriteIds: buildFavoriteIds(favorites),
        loaded: true,
      });
    } catch {
      toast.error('No se pudieron cargar los favoritos.');
    } finally {
      set({ loading: false });
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // ADD FAVORITE
  // ────────────────────────────────────────────────────────────────────────

  addFavorite: async (productId: string) => {
    const { favoriteIds } = get();

    // Ya existe localmente — no duplicar
    if (favoriteIds.has(productId)) {
      toast('Este producto ya está en tus favoritos.', { icon: '♡' });
      return false;
    }

    /**
     * FIX: Optimistic update completo — Set + favorites[].
     *
     * Antes solo se actualizaba favoriteIds (Set). El problema es que en
     * React StrictMode / algunas versiones de Zustand, actualizar solo el
     * Set no siempre dispara el re-render del selector booleano
     * `state.favoriteIds.has(productId)` en el mismo ciclo de render.
     *
     * Al agregar también un item temporal a favorites[], garantizamos que
     * el estado es consistente y el corazón se activa en el PRIMER click.
     *
     * El item temporal usa id: -1 como señal de "optimista pendiente".
     * Cuando el backend responde, lo filtramos y lo reemplazamos con el
     * item real que incluye todos los datos del producto.
     */
    const optimisticItem: FavoriteItem = {
      id: -1,
      userId: '',
      productId,
      createdAt: new Date().toISOString(),
      product: {
        id: productId,
        name: '',
        description: '',
        categoryId: 0,
        baseWeight: 0,
        additionalValue: 0,
        calculatedPrice: 0,
        discountValue: 0,
        finalPrice: 0,
        stock: 0,
        status: 'AVAILABLE',
        images: [],
        specifications: {},
      },
    };

    set((state) => ({
      favoriteIds: new Set([...state.favoriteIds, productId]),
      favorites: [...state.favorites, optimisticItem],
    }));

    try {
      const newItem = await favoriteService.add(productId);

      /**
       * El POST confirma el alta pero devuelve el favorito SIN el `product`
       * (ver contrato asimétrico en la cabecera del archivo). Por eso aquí NO
       * validamos `newItem.product`: solo reconciliamos los datos reales que sí
       * llegan —`id` y `createdAt`— sobre el item optimista, conservando el
       * placeholder del producto. La hidratación completa ocurre en
       * `loadFavorites(true)`.
       *
       * `confirmedId` usa un fallback defensivo por si el backend devolviera un
       * id no válido en runtime; basta con que sea distinto de -1 para que deje
       * de considerarse "optimista pendiente".
       */
      const confirmedId = newItem.id > 0 ? newItem.id : Date.now();

      set((state) => {
        // Confirmar el item optimista (id: -1) de este productId con los datos
        // reales del backend, sin descartarlo por falta de `product`.
        const merged = state.favorites.map((f) =>
          f.productId === productId && f.id === -1
            ? { ...f, id: confirmedId, createdAt: newItem.createdAt }
            : f,
        );

        const updated = sanitizeFavorites(merged);

        return {
          favorites: updated,
          favoriteIds: buildFavoriteIds(updated),
        };
      });

      toast.success('Producto agregado a favoritos.');

      return true;
    } catch (error: unknown) {
      // Revert: quitar el item optimista y el ID del Set
      set((state) => {
        const ids = new Set(state.favoriteIds);
        ids.delete(productId);
        const favs = state.favorites.filter(
          (f) => !(f.productId === productId && f.id === -1),
        );
        return { favoriteIds: ids, favorites: favs };
      });

      const status = (
        error as { response?: { status?: number } }
      )?.response?.status;

      if (status === 409) {
        // El backend dice que ya existe — sincronizamos con la verdad del servidor
        await get().loadFavorites(true);
        toast('Este producto ya está en tus favoritos.', { icon: '♡' });
      } else {
        toast.error('No se pudo agregar a favoritos. Intenta de nuevo.');
      }

      return false;
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // REMOVE FAVORITE
  // ────────────────────────────────────────────────────────────────────────

  removeFavorite: async (productId: string) => {
    const previousFavorites = get().favorites;

    // Optimistic update
    const updatedFavorites = previousFavorites.filter(
      (f) => f.productId !== productId,
    );

    set({
      favorites: updatedFavorites,
      favoriteIds: buildFavoriteIds(updatedFavorites),
    });

    try {
      await favoriteService.remove(productId);
    } catch {
      // Revertir
      set({
        favorites: previousFavorites,
        favoriteIds: buildFavoriteIds(previousFavorites),
      });

      toast.error('No se pudo eliminar de favoritos. Intenta de nuevo.');
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // CLEAR ALL FAVORITES
  // ────────────────────────────────────────────────────────────────────────

  clearAllFavorites: async () => {
    const previousFavorites = get().favorites;

    const productIds = previousFavorites.map((f) => f.productId);

    // Optimistic clear
    set({
      favorites: [],
      favoriteIds: new Set(),
    });

    try {
      const results = await Promise.allSettled(
        productIds.map((id) => favoriteService.remove(id)),
      );

      const failed = results.some((r) => r.status === 'rejected');

      if (failed) {
        await get().loadFavorites(true);
        toast.error('Algunos favoritos no se pudieron eliminar.');
        return;
      }

      set({
        favorites: [],
        favoriteIds: new Set(),
        loaded: true,
      });

      toast.success('Favoritos vaciados.');
    } catch {
      set({
        favorites: previousFavorites,
        favoriteIds: buildFavoriteIds(previousFavorites),
      });

      toast.error('No se pudieron vaciar los favoritos.');
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────────

  isFavorite: (productId: string) =>
    get().favoriteIds.has(productId),

  clearFavorites: () => {
    set({
      favorites: [],
      favoriteIds: new Set(),
      loaded: false,
      loading: false,
    });
  },
}));
