/**
 * @file discount-product-picker-modal.tsx
 * @description Modal del panel admin para buscar un producto del catálogo y
 * asignarle un descuento en COP. Sigue el mismo patrón visual y de búsqueda que
 * `featured-product-picker-modal`, pero con un **segundo paso**: tras elegir el
 * producto, se captura el valor del descuento antes de confirmar.
 *
 * ## Flujo de dos pasos
 * 1. **Selección** — lista filtrable de productos `AVAILABLE` que NO tengan ya
 *    un descuento (se excluyen vía `excludedProductIds`). Click en uno lo elige.
 * 2. **Valor** — panel con el producto elegido, su precio y un input de
 *    descuento (con formateo de miles en vivo). Validación cliente: entero
 *    `> 0` y `≤` precio calculado. Al confirmar se dispara `onApply`.
 *
 * ## Sobre el listado
 * Igual que el picker de destacados, se trae UNA sola página del catálogo con
 * el `limit` máximo (48) y se filtra client-side por nombre. Suficiente para una
 * joyería con < 100 productos `AVAILABLE`.
 *
 * ## Sistema de color
 * Tokens de `tokens.css` exclusivamente; funciona en light y dark sin `.dark`.
 *
 * @see featured-product-picker-modal.tsx — picker hermano del que parte este.
 * @see discount-amount-input.tsx — input compacto reutilizado en el paso 2.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Loader, Search, Tag, X } from 'lucide-react';
import { productService } from '@/features/catalog/services/product.service';
import { SERVER_URL } from '@/api/server-url';
import type { Product } from '@/features/catalog/types/product.types';
import { DiscountAmountInput } from './discount-amount-input';

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

/** Resuelve la URL de la miniatura de un producto, con fallback. */
const resolveThumbnail = (images: string[]): string => {
  const first = images?.[0];
  if (!first) return FALLBACK_IMAGE;
  if (first.startsWith('http')) return first;
  return `${SERVER_URL}/uploads/products/${first}`;
};

/**
 * Etiqueta legible de categoría: "Padre → Subcategoría" o solo el nombre raíz.
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

interface DiscountProductPickerModalProps {
  /** Controla si el modal está abierto. */
  isOpen: boolean;
  /**
   * UUIDs que ya tienen descuento y deben ocultarse del listado para no
   * duplicar (para modificar uno existente se usa la fila inline de la lista).
   */
  excludedProductIds: string[];
  /** `true` mientras la mutación de aplicar el descuento está en curso. */
  isSubmitting: boolean;
  /** Cierra el modal sin aplicar nada. */
  onClose: () => void;
  /**
   * Se invoca con el UUID del producto y el descuento (entero en COP) a aplicar.
   * La capa superior persiste y maneja el resultado.
   */
  onApply: (productId: string, discountValue: number) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Modal de selección de producto + asignación de descuento.
 *
 * Mantiene el modal desacoplado de la persistencia: solo emite `onApply` con el
 * producto y el valor; la capa superior llama al servicio y maneja el toast.
 */
export const DiscountProductPickerModal = ({
  isOpen,
  excludedProductIds,
  isSubmitting,
  onClose,
  onApply,
}: DiscountProductPickerModalProps) => {
  // ── Estado interno ──────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Texto del buscador en vivo (sin debounce). */
  const [searchInput, setSearchInput] = useState('');
  /** Término debounced que se aplica al filtrado. */
  const [searchTerm, setSearchTerm] = useState('');

  /** Producto elegido en el paso 1 — al estar presente, se muestra el paso 2. */
  const [selected, setSelected] = useState<Product | null>(null);
  /** Dígitos crudos del descuento que se escribe en el paso 2. */
  const [discountDigits, setDiscountDigits] = useState('');
  /** Mensaje de validación del paso 2. */
  const [valueError, setValueError] = useState<string | null>(null);

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
    setSelected(null);
    setDiscountDigits('');
    setValueError(null);
    void loadProducts();

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
    return filtered.filter((p) => p.name.toLowerCase().includes(searchTerm));
  }, [products, excludedSet, searchTerm]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handlePick = (product: Product) => {
    if (isSubmitting) return;
    setSelected(product);
    setDiscountDigits('');
    setValueError(null);
  };

  /** Vuelve del paso 2 (valor) al paso 1 (selección). */
  const handleBackToList = () => {
    if (isSubmitting) return;
    setSelected(null);
    setValueError(null);
  };

  const handleApply = () => {
    if (!selected) return;
    const parsed = Number(discountDigits);
    if (discountDigits.trim() === '' || !Number.isFinite(parsed) || parsed <= 0) {
      setValueError('Ingresa un descuento mayor a 0.');
      return;
    }
    if (parsed > selected.calculatedPrice) {
      setValueError('No puede superar el precio actual.');
      return;
    }
    onApply(selected.id, parsed);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="discount-picker-overlay"
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
          aria-labelledby="discount-picker-title"
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
                <Tag size={18} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="discount-picker-title"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {selected ? 'Asignar descuento' : 'Agregar descuento'}
                </h2>
                <p
                  className="mt-0.5 truncate"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {selected
                    ? 'Define el valor del descuento en COP para el producto.'
                    : 'Busca un producto disponible para asignarle un descuento.'}
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

            {selected ? (
              // ── Paso 2: capturar el valor del descuento ─────────────
              <DiscountValueStep
                product={selected}
                discountDigits={discountDigits}
                valueError={valueError}
                isSubmitting={isSubmitting}
                onChangeDigits={(digits) => {
                  setDiscountDigits(digits);
                  setValueError(null);
                }}
                onBack={handleBackToList}
                onApply={handleApply}
              />
            ) : (
              <>
                {/* ── Paso 1: buscador ───────────────────────────────── */}
                <div className="px-5 pb-3 pt-4 sm:px-6">
                  <label htmlFor="discount-picker-search" className="sr-only">
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
                      id="discount-picker-search"
                      ref={searchInputRef}
                      type="text"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Buscar por nombre…"
                      autoComplete="off"
                      className="w-full py-2.5 pl-9 pr-3 transition-colors duration-200"
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

                {/* ── Paso 1: lista de productos ─────────────────────── */}
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
                          : 'No hay productos disponibles sin descuento.'
                      }
                    />
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {visibleProducts.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => handlePick(product)}
                            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--bg-hover)]"
                            style={{
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'transparent',
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
                            <Tag
                              size={16}
                              className="flex-shrink-0"
                              style={{ color: 'var(--text-muted)' }}
                              aria-hidden="true"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

// ─── Paso 2: capturar el valor del descuento ──────────────────────────────────

interface DiscountValueStepProps {
  product: Product;
  discountDigits: string;
  valueError: string | null;
  isSubmitting: boolean;
  onChangeDigits: (digits: string) => void;
  onBack: () => void;
  onApply: () => void;
}

/**
 * Panel del segundo paso: muestra el producto elegido y captura el descuento.
 *
 * @internal
 */
const DiscountValueStep = ({
  product,
  discountDigits,
  valueError,
  isSubmitting,
  onChangeDigits,
  onBack,
  onApply,
}: DiscountValueStepProps) => {
  // Vista previa del precio final mientras se escribe el descuento.
  const parsed = Number(discountDigits);
  const previewFinal =
    Number.isFinite(parsed) && parsed > 0 && parsed <= product.calculatedPrice
      ? product.calculatedPrice - parsed
      : null;

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
      {/* Producto elegido */}
      <div
        className="flex items-center gap-3 p-3"
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-primary)',
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
            (event.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
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
            {resolveCategoryLabel(product)} · {formatPrice(product.calculatedPrice)}
          </p>
        </div>
      </div>

      {/* Campo de descuento */}
      <div className="mt-4">
        <label
          htmlFor="discount-value-input"
          className="mb-1.5 block"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-secondary)',
          }}
        >
          Descuento en COP
        </label>
        <DiscountAmountInput
          id="discount-value-input"
          value={discountDigits}
          onChange={onChangeDigits}
          disabled={isSubmitting}
          hasError={valueError !== null}
        />

        {valueError ? (
          <p
            className="mt-1.5"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.72rem',
              color: 'var(--danger, #c0392b)',
            }}
          >
            {valueError}
          </p>
        ) : previewFinal !== null ? (
          <p
            className="mt-1.5"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            Precio final:{' '}
            <span style={{ color: 'var(--text-accent)', fontWeight: 'var(--font-semibold)' }}>
              {formatPrice(previewFinal)}
            </span>
          </p>
        ) : (
          <p
            className="mt-1.5"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            Debe ser mayor a 0 y no superar el precio actual.
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 text-[var(--text-sm)] transition-colors duration-150 hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'transparent',
          }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Elegir otro
        </button>

        <button
          type="button"
          onClick={onApply}
          disabled={isSubmitting}
          className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[var(--text-sm)] transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--accent-text)',
            backgroundColor: 'var(--accent-vivid, var(--accent))',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
          }}
        >
          {isSubmitting && (
            <Loader size={14} className="animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? 'Aplicando…' : 'Aplicar descuento'}
        </button>
      </div>
    </div>
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
