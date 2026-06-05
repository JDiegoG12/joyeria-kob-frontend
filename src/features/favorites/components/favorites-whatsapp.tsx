/**
 * @file favorites-whatsapp.tsx
 * @description Botón que genera un mensaje de WhatsApp con la lista de favoritos.
 *
 * El mensaje incluye: nombre del cliente, lista de productos (nombre, categoría,
 * precio). Se deshabilita si no hay favoritos en la lista.
 */

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useFavoriteStore } from '../store/favorite.store';

const WHATSAPP_NUMBER = '573135007459';

// ─── Helper: formatear precio ────────────────────────────────────────────────

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

// ─── Componente ───────────────────────────────────────────────────────────────

export const FavoritesWhatsAppButton = () => {
  const { favorites } = useFavoriteStore();
  const { user } = useAuthStore();

  const isEmpty = favorites.length === 0;

  const handleClick = () => {
    if (isEmpty) return;

    const firstName = user?.name?.split(' ')[0] ?? 'Cliente';

    const productLines = favorites
      .map((f, i) => {
        const categoryName = f.product.category?.name ?? '';
        const parentName = f.product.category?.parent?.name ?? '';
        const cat = parentName ? `${parentName} › ${categoryName}` : categoryName;
        return `${i + 1}. *${f.product.name}*\n   Categoría: ${cat}\n   Precio: ${formatPrice(f.product.calculatedPrice)}`;
      })
      .join('\n\n');

    const message =
      `Hola! Soy *${firstName}* y me interesan estas joyas de su catálogo:\n\n` +
      `${productLines}\n\n` +
      `Me gustaría recibir asesoría personalizada. ¡Gracias!`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isEmpty}
      whileTap={isEmpty ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      aria-label={
        isEmpty
          ? 'Agrega productos a favoritos antes de consultar'
          : 'Consultar lista por WhatsApp'
      }
      title={isEmpty ? 'Agrega productos a favoritos antes de consultar' : undefined}
      className="flex cursor-pointer items-center justify-center gap-2 border px-5 py-2.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-bold)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        backgroundColor: isEmpty ? 'transparent' : 'var(--accent)',
        borderColor: isEmpty ? 'var(--border-color)' : 'var(--accent)',
        color: isEmpty ? 'var(--text-muted)' : 'var(--accent-text)',
        cursor: isEmpty ? 'not-allowed' : 'pointer',
        opacity: isEmpty ? 0.5 : 1,
      }}
    >
      <MessageCircle size={16} strokeWidth={1.8} aria-hidden="true" />
      <span>Consultar por WhatsApp</span>
    </motion.button>
  );
};
