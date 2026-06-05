/**
 * @file use-favorite-action.ts
 * @description Hook que encapsula la lógica de agregar/quitar favoritos
 * con verificación de autenticación.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useFavoriteStore } from '../store/favorite.store';

interface UseFavoriteActionReturn {
  toggle: () => Promise<void>;
  isFavorite: boolean;
  isPending: boolean;
}

export const useFavoriteAction = (
  productId: string,
): UseFavoriteActionReturn => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  // Suscripción reactiva al estado real
  const currentlyFavorite = useFavoriteStore(
    (state) => state.favoriteIds.has(productId),
  );

  const addFavorite = useFavoriteStore(
    (state) => state.addFavorite,
  );

  const removeFavorite = useFavoriteStore(
    (state) => state.removeFavorite,
  );

  const toggle = async () => {
    if (isPending) return;

    if (!isAuthenticated) {
      toast('Inicia sesión para guardar favoritos.', {
        icon: '♡',
      });
      navigate('/login');
      return;
    }

    setIsPending(true);

    try {
      // Leer estado fresco del store
      const isCurrentlyFavorite =
        useFavoriteStore
          .getState()
          .favoriteIds
          .has(productId);

      if (isCurrentlyFavorite) {
        await removeFavorite(productId);
      } else {
        await addFavorite(productId);
      }
    } finally {
      setIsPending(false);
    }
  };

  return {
    toggle,
    isFavorite: currentlyFavorite,
    isPending,
  };
};