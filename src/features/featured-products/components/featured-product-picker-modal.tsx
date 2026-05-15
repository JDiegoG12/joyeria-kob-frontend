/**
 * @file featured-product-picker-modal.tsx
 * @description Modal del panel admin para seleccionar un producto del catálogo
 * y agregarlo a la lista de destacados.
 *
 * ## Responsabilidades
 * - Cargar el catálogo público (productos `AVAILABLE`) usando el endpoint
 *   `/products/catalog` ya existente.
 * - Filtrar client-side los productos que ya estén destacados (no permitir
 *   duplicados aunque el backend también lo valide).
 * - Permitir búsqueda por nombre (debounce 250 ms) y mostrar miniatura,
 *   nombre, categoría y precio calculado por cada candidato.
 * - Al confirmar, llamar a `addFeatured(productId)` del store.
 *
 * ## Sobre el listado
 * El backend de catálogo pagina (12 productos por página por defecto).
 * Para el picker subimos el `limit` al máximo (48) y traemos UNA sola página.
 * Si el catálogo crece mucho más allá de eso, se puede iterar paginando, pero
 * para una joyería con < 100 productos AVAILABLE es más que suficiente.
 *
 * ## Sistema de color
 * Tokens de `tokens.css` exclusivamente. El modal funciona en light y dark
 * sin selectores `.dark`.
 *
 * @see featured-products-card.tsx — tarjeta admin que abre este modal.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Loader, Star, Plus } from 'lucide-react';
import { productService } from '@/features/catalog/services/product.service';
import { SERVER_URL } from '@/api/server-url';
import type { Product } from '@/features/catalog/types/product.types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=200&q=80';

/** Cantidad máxima de productos por página que admite el endpoint /catalog. */
const CATALOG_PAGE_LIMIT = 48;

/** Debounce del buscador para evitar filtrar en cada tecla. */
const SEARCH_DEBOUNCE_MS = 250;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formatea un precio en pesos colombianos. */
const formatPrice = (price: number): string =>
  `$${price.toLocaleString('es-CO')}`;

/**
 * Resuelve la URL de la miniatura de un producto.
 * Si no tiene imágenes o el nombre falla, cae al fallback.
 */
const resolveThumbnail = (images: string[]): string => {
  const first = images?.[0];
  if (!first) return FALLBACK_IMAGE;
  if (first.startsWith('http')) return first;
  return `${SERVER_URL}/uploads/products/${first}`;
};

/**
 * Devuelve un nombre legible de categoría a partir del objeto anidado del
 * producto. Si el producto pertenece a una subcategoría se muestra
 * "Padre → Subcategoría", si no, solo el nombre raíz.
 */
const resolveCategoryLabel = (product: Product): string => {
  const category = product.category;
  if (!category) return '—';
  if (category.parent) return `${category.parent.name} → ${category.name}`;
  return category.name;
};

// ─── Animaciones ──────────────────────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface FeaturedProductPickerModalProps {
  /** Controla si el modal está abierto. */
  isOpen: boolean;
  /**
   * UUIDs ya destacados que deben ocultarse del listado para evitar duplicados.
   * El backend también valida, pero filtrar en cliente da feedback inmediato.
   */
  excludedProductIds: string[];
  /** `true` mientras la mutación de agregar está en curso. */
  isSubmitting: boolean;
  /** Cierra el modal sin agregar nada. */
  onClose: () => void;
  /**
   * Se invoca con el UUID del producto seleccionado.
   * La capa superior se encarga de llamar al store y manejar el resultado.
   */
  onSelect: (productId: string) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Modal de selección de producto para agregar a destacados.
 *
 * Renderiza una lista filtrable de productos `AVAILABLE` que NO estén ya
 * destacados. Al hacer click en uno, dispara `onSelect(productId)` — la
 * lógica de persistencia vive en la capa superior para mantener el modal
 * desacoplado del store.
 */
export const FeaturedProductPickerModal = ({
  isOpen,
  excludedProductIds,
  isSubmitting,
  onClose,
  onSelect,
}: FeaturedProductPickerModalProps) => {
  // ── Estado interno ──────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Texto del buscador en vivo (sin debounce). */
  const [searchInput, setSearchInput] = useState('');
  /** Término debounced que se aplica al filtrado. */
  const [searchTerm, setSearchTerm] = useState('');

  /** UUID seleccionado en la sesión actual del modal (resalta la fila). */
  const [pickedId, setPickedId] = useState<string | null>(null);

  /** Ref para enfocar el buscador automáticamente al abrir el modal. */
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Carga del catálogo cuando se abre ───────────────────────────────────
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { products: result } = await productService.getCatalog({
        page: 1,
        limit: CATALOG_PAGE_LIMIT,
      });
      setProducts(result);
    } catch {
      setLoadError(
        'No se pudo cargar el catálogo. Verifica tu conexión e intenta de nuevo.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset y carga al abrir.
  useEffect(() => {
    if (!isOpen) return;
    setSearchInput('');
    setSearchTerm('');
    setPickedId(null);
    void loadProducts();

    // Foco inicial al buscador para acelerar el filtrado por teclado.
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [isOpen, loadProducts]);

  // Debounce del buscador.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  // Cerrar con Escape, bloquear scroll del body mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, isSubmitting, onClose]);

  // ── Filtrado client-side ────────────────────────────────────────────────
  const excludedSet = useMemo(
    () => new Set(excludedProductIds),
    [excludedProductIds],
  );

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((p) => !excludedSet.has(p.id));
    if (!searchTerm) return filtered;
    return filtered.filter((p) =>
      p.name.toLowerCase().includes(searchTerm),
    );
  }, [products, excludedSet, searchTerm]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSelect = (productId: string) => {
    if (isSubmitting) return;
    setPickedId(productId);
    onSelect(productId);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="picker-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="picker-title"
        >
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden shadow-2xl"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {/* ── Encabezado del modal ───────────────────────────────── */}
            <div
              className="flex items-center gap-3 border-b px-5 py-4 sm:px-6"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-vivid, var(--accent))',
                }}
              >
                <Star size={18} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="picker-title"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Agregar producto destacado
                </h2>
                <p
                  className="mt-0.5 truncate"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Selecciona un producto disponible para destacarlo en la home.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Cerrar selector"
                className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'transparent',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Buscador ───────────────────────────────────────────── */}
            <div className="px-5 pb-3 pt-4 sm:px-6">
              <label htmlFor="picker-search" className="sr-only">
                Buscar producto por nombre
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Search size={15} strokeWidth={1.8} />
                </span>
                <input
                  id="picker-search"
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Buscar por nombre…"
                  autoComplete="off"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2.5 transition-colors duration-200 disabled:opacity-60"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.borderColor =
                      'var(--border-accent)';
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.borderColor =
                      'var(--border-color)';
                  }}
                />
              </div>
            </div>

            {/* ── Lista de productos ────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
              {isLoading ? (
                <ListSkeleton />
              ) : loadError ? (
                <ListMessage tone="error" message={loadError} />
              ) : visibleProducts.length === 0 ? (
                <ListMessage
                  tone="info"
                  message={
                    searchTerm
                      ? `No hay productos disponibles que coincidan con "${searchTerm}".`
                      : 'No hay productos disponibles para destacar.'
                  }
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {visibleProducts.map((product) => {
                    const isPicked = pickedId === product.id;
                    return (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(product.id)}
                          disabled={isSubmitting}
                          className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            border: `1px solid ${isPicked ? 'var(--border-accent)' : 'var(--border-color)'}`,
                            backgroundColor: isPicked
                              ? 'var(--accent-subtle)'
                              : 'transparent',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <img
                            src={resolveThumbnail(product.images)}
                            alt=""
                            aria-hidden="true"
                            className="h-12 w-12 flex-shrink-0 object-cover"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              borderRadius: 'var(--radius-xs)',
                            }}
                            onError={(event) => {
                              (event.currentTarget as HTMLImageElement).src =
                                FALLBACK_IMAGE;
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate"
                              style={{
                                fontFamily: 'var(--font-ui)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--font-semibold)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {product.name}
                            </p>
                            <p
                              className="mt-0.5 truncate"
                              style={{
                                fontFamily: 'var(--font-ui)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {resolveCategoryLabel(product)} ·{' '}
                              {formatPrice(product.calculatedPrice)}
                            </p>
                          </div>
                          {isPicked && isSubmitting ? (
                            <Loader
                              size={16}
                              className="flex-shrink-0 animate-spin"
                              style={{ color: 'var(--accent)' }}
                              aria-hidden="true"
                            />
                          ) : (
                            <Plus
                              size={16}
                              className="flex-shrink-0"
                              style={{ color: 'var(--text-muted)' }}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

// ─── Subcomponentes auxiliares ────────────────────────────────────────────────

/**
 * Skeleton para la lista mientras carga el catálogo.
 *
 * @internal
 */
const ListSkeleton = () => (
  <ul className="flex flex-col gap-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <li
        key={index}
        className="flex animate-pulse items-center gap-3 px-3 py-2.5"
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          animationDelay: `${index * 60}ms`,
        }}
      >
        <div
          className="h-12 w-12 flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-xs)',
          }}
        />
        <div className="flex-1">
          <div
            className="h-3 w-3/5 rounded"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
          <div
            className="mt-2 h-2.5 w-2/5 rounded"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
        </div>
      </li>
    ))}
  </ul>
);

interface ListMessageProps {
  /** Tono del mensaje — afecta el color del texto. */
  tone: 'info' | 'error';
  /** Texto a mostrar. */
  message: string;
}

/**
 * Mensaje centrado para estado vacío o error de carga.
 *
 * @internal
 */
const ListMessage = ({ tone, message }: ListMessageProps) => (
  <div
    className="flex items-center justify-center py-10 text-center"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      color: tone === 'error' ? 'var(--color-error)' : 'var(--text-muted)',
    }}
  >
    {message}
  </div>
);
