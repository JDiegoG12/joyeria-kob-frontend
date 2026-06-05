/**
 * @file featured-products-card.tsx
 * @description Tarjeta del panel admin para gestionar los productos destacados
 * de la página de inicio de Joyería KOB.
 *
 * ## Comportamiento colapsable
 * Igual que `HeroBannerCard`: el cuerpo está colapsado por defecto y solo se
 * expande al pulsar "Editar destacados". El encabezado siempre muestra el
 * contador `X/6` para que el admin sepa el estado sin abrir.
 *
 * ## Gestión interactiva
 * - **Reordenar**: drag-and-drop nativo con `Reorder.Group` / `Reorder.Item`
 *   de `framer-motion` (ya está instalado, cero deps extra). Al soltar, se
 *   dispara el reorder con debounce para evitar spam de requests cuando el
 *   admin reordena varias veces seguidas.
 * - **Agregar**: botón "Agregar destacado" abre `FeaturedProductPickerModal`.
 *   Deshabilitado al alcanzar el límite de 6.
 * - **Eliminar**: botón "X" en cada fila → `ConfirmModal` (acción destructiva).
 *
 * ## Slots vacíos
 * Mientras haya menos de 6 destacados se muestran filas placeholder que
 * invitan a completar la lista. No son arrastrables ni eliminables.
 *
 * ## Sistema de color
 * Tokens exclusivos de `tokens.css`. Para el acento usa el mismo patrón que
 * `HeroBannerCard`: `var(--accent-vivid, var(--accent))`.
 *
 * @see featured-product.store.ts — store consumido para todas las mutaciones.
 * @see featured-product-picker-modal.tsx — modal para agregar destacados.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Reorder,
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import {
  ChevronUp,
  GripVertical,
  Loader,
  Pencil,
  Plus,
  Star,
  X,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { useFeaturedProductStore } from '@/store/featured-product.store';
import { useToastStore } from '@/store/toast.store';
import {
  MAX_FEATURED_PRODUCTS,
  type FeaturedProductWithProduct,
} from '@/features/featured-products/types/featured-product.types';
import { SERVER_URL } from '@/api/server-url';
import { FeaturedProductPickerModal } from './featured-product-picker-modal';

// ─── Constantes ───────────────────────────────────────────────────────────────

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=200&q=80';

/**
 * Debounce del reorder. Cada arrastre dentro de este intervalo se acumula
 * en un único request al backend cuando el admin termina de mover.
 */
const REORDER_DEBOUNCE_MS = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formatea un precio en pesos colombianos. */
const formatPrice = (price: number): string =>
  `$${price.toLocaleString('es-CO')}`;

/** Resuelve la URL de la primera imagen del producto. */
const resolveThumbnail = (images: string[]): string => {
  const first = images?.[0];
  if (!first) return FALLBACK_IMAGE;
  if (first.startsWith('http')) return first;
  return `${SERVER_URL}/uploads/products/${first}`;
};

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Tarjeta admin de gestión de productos destacados.
 *
 * Carga los destacados al montar (si aún no estaban en el store), permite
 * agregarlos, eliminarlos y reordenarlos. Toda mutación da feedback inmediato
 * por toast y, en el caso del reorden, se aplica de forma optimista para
 * que el admin perciba la interacción como instantánea.
 */
export const FeaturedProductsCard = () => {
  const {
    items,
    isFetching,
    isSaving,
    fetchFeatured,
    addFeatured,
    removeFeatured,
    reorderFeatured,
  } = useFeaturedProductStore();
  const { showToast } = useToastStore();
  const shouldReduceMotion = useReducedMotion();

  // ── Estado local ────────────────────────────────────────────────────────

  /** Controla la visibilidad del panel de edición. */
  const [isExpanded, setIsExpanded] = useState(false);

  /** Lista ordenada localmente — sincronizada con `items` salvo durante drag. */
  const [localOrder, setLocalOrder] = useState<FeaturedProductWithProduct[]>(
    [],
  );

  /** Producto pendiente de eliminar — abre el `ConfirmModal` cuando es no-null. */
  const [productToRemove, setProductToRemove] =
    useState<FeaturedProductWithProduct | null>(null);

  /** Controla la visibilidad del modal de selección. */
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /**
   * Timer del debounce para persistir el reorden tras el drag-and-drop.
   * Cada cambio reinicia el timer; solo el último orden se envía al backend.
   */
  const reorderTimerRef = useRef<number | null>(null);

  // ── Carga inicial ───────────────────────────────────────────────────────

  useEffect(() => {
    void fetchFeatured();
  }, [fetchFeatured]);

  // Mantener `localOrder` sincronizado con la fuente de verdad del store.
  useEffect(() => {
    setLocalOrder(items);
  }, [items]);

  // Limpieza del timer si el componente se desmonta con un reorder pendiente.
  useEffect(() => {
    return () => {
      if (reorderTimerRef.current !== null) {
        window.clearTimeout(reorderTimerRef.current);
      }
    };
  }, []);

  // ── Datos derivados ─────────────────────────────────────────────────────

  const totalActive = localOrder.length;
  const isAtCapacity = totalActive >= MAX_FEATURED_PRODUCTS;
  const emptySlotCount = Math.max(0, MAX_FEATURED_PRODUCTS - totalActive);
  const excludedProductIds = useMemo(
    () => localOrder.map((item) => item.productId),
    [localOrder],
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  /**
   * Maneja el reorden local del `Reorder.Group`.
   *
   * Si el orden no cambió respecto al estado actual (caso de un drag que
   * regresa al origen), se omite la persistencia para no spamear al backend.
   * En caso contrario, se programa el reorder con debounce.
   */
  const handleReorder = (next: FeaturedProductWithProduct[]) => {
    setLocalOrder(next);

    // Cancelar cualquier persistencia pendiente y reprogramar.
    if (reorderTimerRef.current !== null) {
      window.clearTimeout(reorderTimerRef.current);
    }

    reorderTimerRef.current = window.setTimeout(() => {
      void persistReorder(next);
    }, REORDER_DEBOUNCE_MS);
  };

  /**
   * Persiste el nuevo orden en el backend.
   * Compara IDs con el estado de la fuente de verdad para evitar requests
   * inútiles cuando el admin termina con el mismo orden de partida.
   */
  const persistReorder = async (ordered: FeaturedProductWithProduct[]) => {
    const currentIds = items.map((it) => it.productId).join('|');
    const nextIds = ordered.map((it) => it.productId).join('|');
    if (currentIds === nextIds) return;

    const ok = await reorderFeatured(ordered);
    if (ok) {
      showToast('success', 'Orden de destacados actualizado.');
    } else {
      showToast(
        'error',
        'No se pudo guardar el nuevo orden. Se restauró el orden anterior.',
      );
    }
  };

  /**
   * Agrega un producto seleccionado desde el modal selector.
   * Cierra el modal en éxito y notifica por toast. En error mantiene el
   * modal abierto para que el admin pueda intentar con otro producto.
   */
  const handleAddFeatured = async (productId: string) => {
    const ok = await addFeatured(productId);
    if (ok) {
      showToast('success', 'Producto agregado a destacados.');
      setIsPickerOpen(false);
    } else {
      showToast(
        'error',
        'No se pudo agregar el producto destacado. Intenta de nuevo.',
      );
    }
  };

  /**
   * Confirma la eliminación de un destacado.
   * Llama al store y cierra el modal de confirmación al terminar.
   */
  const handleConfirmRemove = async () => {
    if (!productToRemove) return;
    const ok = await removeFeatured(productToRemove.productId);
    if (ok) {
      showToast('success', 'Producto retirado de destacados.');
    } else {
      showToast('error', 'No se pudo eliminar el producto destacado.');
    }
    setProductToRemove(null);
  };

  /**
   * Colapsa el panel. No descarta cambios porque las mutaciones ya se han
   * persistido (no hay estado intermedio sin guardar en este flujo).
   */
  const handleCollapse = () => setIsExpanded(false);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className="border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-xs)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {/* ── Encabezado siempre visible ─────────────────────────────────── */}
        <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
          {/*
           * Patrón de color idéntico a HeroBannerCard:
           *   color: var(--accent-vivid, var(--accent))
           * En light el fallback resuelve al azul de marca; en dark
           * `--accent-vivid` toma el control para legibilidad.
           */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-vivid, var(--accent))',
            }}
          >
            <Star size={20} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="text-[0.98rem] sm:text-[var(--text-base)]"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Productos destacados
            </h3>
            <p
              className="mt-0.5 truncate text-[0.8rem] sm:text-[var(--text-sm)]"
              style={{
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-muted)',
              }}
            >
              {isFetching && totalActive === 0
                ? 'Cargando destacados…'
                : `${totalActive} de ${MAX_FEATURED_PRODUCTS} configurados.`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => (isExpanded ? handleCollapse() : setIsExpanded(true))}
            aria-expanded={isExpanded}
            aria-controls="featured-products-panel"
            className="flex flex-shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.78rem] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[var(--text-sm)] transition-opacity hover:opacity-85 active:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 'var(--font-semibold)',
              color: isExpanded ? 'var(--text-muted)' : 'var(--accent-text)',
              backgroundColor: isExpanded
                ? 'transparent'
                : 'var(--accent-vivid, var(--accent))',
              border: isExpanded ? '1px solid var(--border-color)' : 'none',
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={15} aria-hidden="true" />
                Cerrar
              </>
            ) : (
              <>
                <Pencil size={14} aria-hidden="true" />
                Editar destacados
              </>
            )}
          </button>
        </div>

        {/* ── Panel de edición (colapsable) ──────────────────────────────── */}
        <div
          id="featured-products-panel"
          style={{ display: isExpanded ? 'block' : 'none' }}
        >
          <div
            className="mx-4 mb-4 h-px sm:mx-6 sm:mb-5"
            style={{ backgroundColor: 'var(--border-color)' }}
          />

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p
                className="text-[0.7rem] sm:text-[var(--text-xs)]"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                Orden visible en la home
              </p>
              {isSaving && (
                <span
                  className="flex items-center gap-1.5"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Loader
                    size={12}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Guardando…
                </span>
              )}
            </div>

            {/*
             * Lista ordenable con framer-motion.
             * - `values={localOrder}` controla la fuente del orden visual.
             * - `onReorder={handleReorder}` se dispara durante el arrastre.
             * - Cada `Reorder.Item` usa `value={item}` para que la librería
             *   pueda inferir el reorder a nivel de array.
             *
             * Si el usuario tiene `prefers-reduced-motion`, el reorden sigue
             * funcionando pero sin animación de layout — framer-motion lo
             * respeta automáticamente.
             */}
            <Reorder.Group
              axis="y"
              values={localOrder}
              onReorder={handleReorder}
              as="ul"
              className="flex flex-col gap-2"
              layoutScroll
            >
              <AnimatePresence initial={false}>
                {localOrder.map((item) => (
                  <FeaturedRow
                    key={item.id}
                    item={item}
                    onRemove={() => setProductToRemove(item)}
                    disabled={isSaving}
                    shouldReduceMotion={shouldReduceMotion ?? false}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {/* Slots vacíos invitan a completar los 6 destacados. */}
            {emptySlotCount > 0 && (
              <ul className="mt-2 flex flex-col gap-2">
                {Array.from({ length: emptySlotCount }).map((_, index) => (
                  <EmptySlotRow
                    key={`empty-${index}`}
                    position={totalActive + index + 1}
                  />
                ))}
              </ul>
            )}

            {/* Pie: botón agregar */}
            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                disabled={isAtCapacity || isSaving}
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[0.82rem] sm:text-[var(--text-sm)] transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--accent-text)',
                  backgroundColor: isAtCapacity
                    ? 'var(--bg-tertiary)'
                    : 'var(--accent-vivid, var(--accent))',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  opacity: isAtCapacity ? 'var(--opacity-disabled)' : 1,
                }}
              >
                <Plus size={14} aria-hidden="true" />
                {isAtCapacity ? 'Límite alcanzado (6)' : 'Agregar destacado'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de selección de producto ───────────────────────────────── */}
      <FeaturedProductPickerModal
        isOpen={isPickerOpen}
        excludedProductIds={excludedProductIds}
        isSubmitting={isSaving}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(productId) => void handleAddFeatured(productId)}
      />

      {/* ── Modal de confirmación para eliminar ──────────────────────────── */}
      <ConfirmModal
        isOpen={productToRemove !== null}
        variant="danger"
        title="¿Retirar de destacados?"
        message={
          productToRemove
            ? `"${productToRemove.product.name}" dejará de aparecer en la sección de productos destacados de la página de inicio.`
            : ''
        }
        confirmLabel="Sí, retirar"
        cancelLabel="Cancelar"
        isLoading={isSaving}
        onConfirm={() => void handleConfirmRemove()}
        onCancel={() => setProductToRemove(null)}
      />
    </>
  );
};

// ─── Subcomponentes ───────────────────────────────────────────────────────────

interface FeaturedRowProps {
  /** Destacado a renderizar en la fila. */
  item: FeaturedProductWithProduct;
  /** Callback al pulsar el botón de eliminar. */
  onRemove: () => void;
  /** `true` mientras hay una mutación en curso — deshabilita el botón. */
  disabled: boolean;
  /** Si el usuario prefiere movimiento reducido. */
  shouldReduceMotion: boolean;
}

/**
 * Fila individual arrastrable de un producto destacado.
 *
 * El `Reorder.Item` cubre toda la fila excepto el botón "X" para que el drag
 * no interfiera con la acción de eliminar. La handle visual (`GripVertical`)
 * indica explícitamente la zona de arrastre aunque toda la fila lo permita.
 *
 * @internal
 */
const FeaturedRow = ({
  item,
  onRemove,
  disabled,
  shouldReduceMotion,
}: FeaturedRowProps) => (
  <Reorder.Item
    value={item}
    dragListener={!disabled}
    /*
     * `whileDrag` da feedback visual del item siendo arrastrado.
     * `prefers-reduced-motion` lo silencia automáticamente.
     */
    whileDrag={
      shouldReduceMotion
        ? undefined
        : {
            scale: 1.02,
            boxShadow: 'var(--shadow-md)',
          }
    }
    className="flex items-center gap-3 px-3 py-2.5"
    style={{
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-sm)',
      cursor: disabled ? 'not-allowed' : 'grab',
      touchAction: 'none',
    }}
  >
    <GripVertical
      size={16}
      strokeWidth={1.6}
      aria-hidden="true"
      style={{
        color: 'var(--text-muted)',
        flexShrink: 0,
      }}
    />

    <img
      src={resolveThumbnail(item.product.images)}
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
        <span
          className="mr-1.5 inline-block min-w-[1.25rem] text-center"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--accent-vivid, var(--accent))',
          }}
        >
          {item.position}.
        </span>
        {item.product.name}
      </p>
      <p
        className="mt-0.5 truncate"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}
      >
        {formatPrice(item.product.calculatedPrice)} ·{' '}
        {item.product.baseWeight} g
      </p>
    </div>

    {/*
     * Botón eliminar.
     * `onPointerDown` con `stopPropagation` evita que el click inicie un drag
     * accidental cuando el admin solo quiere eliminar.
     */}
    <button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onRemove}
      disabled={disabled}
      aria-label={`Retirar ${item.product.name} de destacados`}
      className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'transparent',
      }}
    >
      <X size={14} aria-hidden="true" />
    </button>
  </Reorder.Item>
);

interface EmptySlotRowProps {
  /** Posición que ocuparía este slot vacío si se completa. */
  position: number;
}

/**
 * Fila placeholder cuando hay menos de 6 destacados.
 * No es arrastrable ni eliminable, solo informa visualmente.
 *
 * @internal
 */
const EmptySlotRow = ({ position }: EmptySlotRowProps) => (
  <motion.li
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-3 px-3 py-2.5"
    style={{
      border: '1px dashed var(--border-color)',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: 'transparent',
    }}
  >
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-xs)',
        color: 'var(--text-muted)',
      }}
      aria-hidden="true"
    >
      <Star size={16} strokeWidth={1.5} />
    </div>

    <div className="min-w-0 flex-1">
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
        }}
      >
        <span
          className="mr-1.5 inline-block min-w-[1.25rem] text-center"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
          }}
        >
          {position}.
        </span>
        Slot vacío
      </p>
      <p
        className="mt-0.5"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}
      >
        Pulsa "Agregar destacado" para completar esta posición.
      </p>
    </div>
  </motion.li>
);
