/**
 * @file use-favorite-action.ts
 * @description Hook que encapsula la lógica de agregar/quitar favoritos
 * con verificación de autenticación.
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useAuthPromptStore } from '@/store/auth-prompt.store';
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
  const openAuthPrompt = useAuthPromptStore((state) => state.open);
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
      // En vez de redirigir, mostramos un modal que deja elegir entre ir a
      // iniciar sesión o seguir explorando sin abandonar la página.
      openAuthPrompt();
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