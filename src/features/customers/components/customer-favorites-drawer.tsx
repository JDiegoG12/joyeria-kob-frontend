/**
 * @file customer-favorites-drawer.tsx
 * @description Drawer lateral que muestra los favoritos de un cliente.
 *
 * Lee su estado del `customer.store` (`favoritesDrawer`). Reutiliza
 * `PublicProductCard` del catálogo para renderizar cada producto favorito,
 * manteniendo una sola fuente de verdad visual para "tarjeta de producto".
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';

import { PublicProductCard } from '@/features/catalog/components/public-product-card';
import { useCustomerStore } from '@/features/customers/store/customer.store';
import { fullName } from '@/features/customers/utils/format';

export const CustomerFavoritesDrawer = () => {
  const { open, customer, items, isLoading, error } = useCustomerStore(
    (s) => s.favoritesDrawer,
  );
  const closeFavorites = useCustomerStore((s) => s.closeFavorites);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeFavorites}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col"
            style={{ backgroundColor: 'var(--bg-primary)' }}
            role="dialog"
            aria-label="Favoritos del cliente"
          >
            {/* Encabezado */}
            <div
              className="flex items-center justify-between gap-3 border-b px-5 py-4"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-2">
                <Heart
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  style={{ color: 'var(--text-accent)' }}
                />
                <div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Favoritos
                  </h2>
                  {customer && (
                    <p
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {fullName(customer)}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={closeFavorites}
                className="flex h-9 w-9 items-center justify-center border transition-colors duration-200 hover:bg-[var(--bg-hover)]"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-secondary)',
                }}
                aria-label="Cerrar"
              >
                <X size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square animate-pulse border"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                      }}
                    />
                  ))}
                </div>
              ) : error ? (
                <p
                  className="mt-10 text-center"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {error}
                </p>
              ) : items.length === 0 ? (
                <div className="mt-16 flex flex-col items-center gap-3 text-center">
                  <Heart
                    size={28}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <p
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Este cliente aún no tiene favoritos.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {items
                    .filter(
                      (item) =>
                        item && item.product && Array.isArray(item.product.images),
                    )
                    .map((item) => (
                      // `onClick` no-op: en el panel admin no existe el modal de
                      // detalle del catálogo; la tarjeta solo se usa como vista.
                      <PublicProductCard
                        key={item.productId}
                        product={item.product}
                        onClick={() => {}}
                      />
                    ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
