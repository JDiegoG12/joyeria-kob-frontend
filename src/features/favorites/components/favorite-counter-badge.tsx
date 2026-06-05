/**
 * @file favorite-counter-badge.tsx
 * @description Badge de contador de favoritos para el navbar.
 *
 * Se superpone sobre el ícono de corazón del navbar mostrando
 * el número de productos en favoritos. Se anima al cambiar el contador.
 *
 * Solo se renderiza si hay al menos 1 favorito (evita mostrar "0").
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useFavoriteStore } from '../store/favorite.store';

interface FavoriteCounterBadgeProps {
  className?: string;
}

export const FavoriteCounterBadge = ({ className = '' }: FavoriteCounterBadgeProps) => {
  const count = useFavoriteStore((s) => s.favorites.length);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-none absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center px-1 ${className}`}
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            fontFamily: 'var(--font-ui)',
            fontSize: '10px',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-wide)',
            borderRadius: '999px',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
};
