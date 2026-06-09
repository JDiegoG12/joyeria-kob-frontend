/**
 * @file favorites-page.tsx
 * @description Página de favoritos del usuario — ruta `/favoritos`.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  BackToHomeButton,
  BackToHomeDivider,
} from '@/components/ui/back-to-home-button';
import { useAuthStore } from '@/store/auth.store';
import { useFavoriteStore } from '../store/favorite.store';

// Reutilizamos la tarjeta del catálogo público en lugar de una tarjeta
// dedicada: una sola fuente de verdad visual para "tarjeta de producto".
import { PublicProductCard } from '@/features/catalog/components/public-product-card';
import { FavoritesWhatsAppButton } from '../components/favorites-whatsapp';

// ──────────────────────────────────────────────────────────────────────────────
// Variantes
// ──────────────────────────────────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

/**
 * Variantes de cada tarjeta dentro del grid de favoritos.
 *
 * Replican el feel de entrada/salida que antes vivía en `FavoriteCard` (ya
 * eliminada): entrada escalonada según el índice (`custom`) y salida con fade +
 * leve scale, que `AnimatePresence mode="popLayout"` reproduce al quitar un
 * favorito desde el corazón. Viven aquí (en el wrapper) porque la tarjeta del
 * catálogo (`PublicProductCard`) es un `<article>` plano, sin motion propio.
 */
const favoriteCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.22, ease: 'easeIn' as const },
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────────────────────────────────────

export const FavoritesPage = () => {
  const { isAuthenticated } = useAuthStore();

  const {
    favorites,
    loading,
    loaded,
    loadFavorites,
    clearAllFavorites,
  } = useFavoriteStore();

  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  // ── Cargar favoritos ──────────────────────────────────────────────────────

  useEffect(() => {
    if (isAuthenticated) {
      void loadFavorites(true);
    }
    // `loadFavorites` es una acción de Zustand (referencia estable): incluirla
    // satisface la regla sin provocar re-ejecuciones extra del efecto.
  }, [isAuthenticated, loadFavorites]);

  // ── NO AUTENTICADO ────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center"
      >
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center border"
          style={{
            borderColor: 'var(--border-strong)',
            color: 'var(--text-muted)',
          }}
        >
          <Heart size={28} strokeWidth={1.5} aria-hidden="true" />
        </div>

        <h1
          className="uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-display)',
            color: 'var(--text-accent)',
          }}
        >
          Favoritos
        </h1>

        <p
          className="mt-3 max-w-xs"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          Inicia sesión para guardar tus joyas favoritas.
        </p>

        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 border px-5 py-2.5 transition-opacity duration-200 hover:opacity-75"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
            borderColor: 'var(--accent)',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
          }}
        >
          Iniciar sesión
        </Link>
      </motion.div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────────────────

  if (loading && !loaded) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
          style={{ maxWidth: 'var(--content-max-width)' }}
        >
          <div className="mb-5 flex items-center gap-3">
            <BackToHomeButton />
            <BackToHomeDivider />
            <Breadcrumb
              items={[{ label: 'Inicio', to: '/' }, { label: 'Favoritos' }]}
            />
          </div>

          <PageHeader count={0} loading />

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 60} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmar vaciar ──────────────────────────────────────────────────────

  const handleClearConfirm = async () => {
    setClearing(true);

    try {
      await clearAllFavorites();
      setShowClearConfirm(false);
    } finally {
      setClearing(false);
    }
  };

  // ── Ver detalle ───────────────────────────────────────────────────────────

  const handleViewDetail = (productId: string) => {
    navigate(`/catalogo?product=${productId}`);
  };

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
        style={{ maxWidth: 'var(--content-max-width)' }}
      >
        {/* Fila superior: botón "Volver" (desktop) + breadcrumb */}
        <div className="mb-5 flex items-center gap-3">
          <BackToHomeButton />
          <BackToHomeDivider />
          <Breadcrumb
            items={[{ label: 'Inicio', to: '/' }, { label: 'Favoritos' }]}
          />
        </div>

        {/* Header */}
        <PageHeader count={favorites.length} />

        <AnimatePresence mode="wait">
          {favorites.length === 0 ? (
            // ── EMPTY ───────────────────────────────────────────────────────
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="mt-12 flex flex-col items-center justify-center border py-24 text-center"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center border"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-muted)',
                }}
              >
                <Heart size={24} strokeWidth={1.5} aria-hidden="true" />
              </div>

              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--text-secondary)',
                }}
              >
                Tu lista de favoritos está vacía.
              </p>

              <Link
                to="/catalogo"
                className="mt-5 inline-flex items-center gap-2 border px-5 py-2.5 transition-opacity duration-200 hover:opacity-75"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-bold)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                  borderColor: 'var(--accent)',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                }}
              >
                <ShoppingBag size={15} />
                Ver catálogo
              </Link>
            </motion.div>
          ) : (
            // ── CONTENT ─────────────────────────────────────────────────────
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Barra acciones */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {favorites.length}{' '}
                  {favorites.length === 1
                    ? 'producto guardado'
                    : 'productos guardados'}
                </p>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <FavoritesWhatsAppButton />

                  {!showClearConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center justify-center gap-2 border px-4 py-2.5 transition-colors duration-200 hover:bg-[var(--bg-hover)]"
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-bold)',
                        letterSpacing: 'var(--tracking-wide)',
                        textTransform: 'uppercase',
                        borderColor: 'var(--border-strong)',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <Trash2 size={14} />
                      Vaciar favoritos
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2"
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        ¿Confirmar?
                      </span>

                      <button
                        type="button"
                        onClick={handleClearConfirm}
                        disabled={clearing}
                        className="border px-3 py-2"
                        style={{
                          borderColor: '#e53e3e',
                          color: '#e53e3e',
                          backgroundColor: 'transparent',
                        }}
                      >
                        {clearing ? 'Eliminando…' : 'Sí'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="border px-3 py-2"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'transparent',
                        }}
                      >
                        Cancelar
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* GRID */}
              <motion.div
                layout
                className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              >
                <AnimatePresence mode="popLayout">
                  {favorites
                    .filter(
                      (item) =>
                        item &&
                        item.product &&
                        Array.isArray(item.product.images),
                    )
                    .map((item, i) => (
                      // Wrapper con la animación de entrada/salida + hover; la
                      // tarjeta reutilizada del catálogo va dentro. El click
                      // navega al catálogo con el modal de detalle abierto vía
                      // deep-link `?product=<id>` (ver `handleViewDetail`).
                      // `key` por `productId` (estable) en vez de `id`, que
                      // puede mutar al reconciliar un alta optimista.
                      <motion.div
                        key={item.productId}
                        layout
                        custom={i}
                        variants={favoriteCardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover={
                          shouldReduceMotion
                            ? undefined
                            : {
                                y: -4,
                                boxShadow: 'var(--shadow-md)',
                                transition: { duration: 0.22, ease: 'easeOut' },
                              }
                        }
                        className="h-full"
                      >
                        <PublicProductCard
                          product={item.product}
                          onClick={() => handleViewDetail(item.product.id)}
                        />
                      </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Header
// ──────────────────────────────────────────────────────────────────────────────

const PageHeader = ({
  count,
  loading = false,
}: {
  count: number;
  loading?: boolean;
}) => (
  <div>
    <h1
      className="uppercase"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--font-bold)',
        letterSpacing: 'var(--tracking-display)',
        lineHeight: 'var(--leading-tight)',
        color: 'var(--text-primary)',
      }}
    >
      Favoritos

      {!loading && count > 0 && (
        <span
          className="ml-3 inline-flex h-7 min-w-7 items-center justify-center px-2"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            borderRadius: '999px',
            verticalAlign: 'middle',
          }}
        >
          {count}
        </span>
      )}
    </h1>

    <div
      className="mt-3 h-px"
      style={{
        background:
          'linear-gradient(to right, var(--border-strong) 60%, transparent)',
      }}
    />
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────────────────────────────────────

const SkeletonCard = ({ delay }: { delay: number }) => (
  <div
    className="animate-pulse border"
    style={{
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      animationDelay: `${delay}ms`,
    }}
  >
    <div
      className="aspect-square w-full"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />

    <div
      className="h-px w-full"
      style={{ backgroundColor: 'var(--border-color)' }}
    />

    <div className="px-3 pb-4 pt-3">
      <div
        className="h-2.5 w-1/2 rounded"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />

      <div
        className="mt-2 h-3 w-3/4 rounded"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />

      <div
        className="mt-2 h-3 w-1/3 rounded"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
    </div>
  </div>
);