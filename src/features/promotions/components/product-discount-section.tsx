/**
 * @file product-discount-section.tsx
 * @description Sección del panel de promociones para gestionar los descuentos en
 * COP de los productos. Sigue el patrón del módulo de destacados: la lista
 * muestra **solo los productos que tienen un descuento activo**, y un botón
 * "Agregar descuento" abre un modal selector para buscar un producto del
 * catálogo y asignarle uno.
 *
 * El descuento se persiste vía `PUT /products/:id` con el campo `discountValue`
 * (no hay store ni endpoint dedicado: vive en el propio `Product`).
 *
 * - **Agregar**: botón "Agregar descuento" → `DiscountProductPickerModal`.
 * - **Modificar**: input inline en cada fila + botón "Guardar".
 * - **Quitar**: botón "Quitar" pone el descuento en 0; la fila desaparece de la
 *   lista al re-filtrarse por `discountValue > 0`.
 *
 * Validación cliente: el descuento debe ser un entero entre 1 y el precio
 * calculado del producto. El backend valida de nuevo de forma autoritativa.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader, Plus, Tag } from 'lucide-react';
import { SERVER_URL } from '@/api/server-url';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { useToastStore } from '@/store/toast.store';
import { productService } from '@/features/catalog/services/product.service';
import type { Product } from '@/features/catalog/types/product.types';
import { DiscountAmountInput } from './discount-amount-input';
import { DiscountProductPickerModal } from './discount-product-picker-modal';

const formatPrice = (price: number): string =>
  `$${price.toLocaleString('es-CO')}`;

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=200&q=70';

const resolveThumb = (images: string[]): string =>
  images.length > 0
    ? `${SERVER_URL}/uploads/products/${images[0]}`
    : FALLBACK_IMAGE;

export const ProductDiscountSection = () => {
  const { showToast } = useToastStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Controla la visibilidad del modal selector. */
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  /** `true` mientras se aplica un descuento desde el modal. */
  const [isApplying, setIsApplying] = useState(false);

  /** Producto pendiente de retirar — abre el `ConfirmModal` cuando no es null. */
  const [productToRemove, setProductToRemove] = useState<Product | null>(null);
  /** `true` mientras se confirma el retiro del descuento. */
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const list = await productService.getAll();
        if (!cancelled) setProducts(list);
      } catch {
        if (!cancelled) setLoadError('No se pudieron cargar los productos.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Productos con descuento activo. `discountValue > 0` implica siempre
   * `finalPrice < calculatedPrice` (el backend deriva `finalPrice`), así que
   * basta con esa condición para poblar la lista.
   */
  const discountedProducts = useMemo(
    () => products.filter((p) => p.discountValue > 0),
    [products],
  );

  /** UUIDs ya con descuento — se excluyen del modal para no duplicar. */
  const excludedProductIds = useMemo(
    () => discountedProducts.map((p) => p.id),
    [discountedProducts],
  );

  /** Inserta o reemplaza un producto en el estado tras guardar su descuento. */
  const upsertProduct = (updated: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      return exists
        ? prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
        : [...prev, updated];
    });
  };

  /** Aplica un descuento desde el modal selector. */
  const handleApplyFromModal = async (
    productId: string,
    discountValue: number,
  ) => {
    setIsApplying(true);
    try {
      const updated = await productService.update(productId, { discountValue });
      upsertProduct(updated);
      showToast('success', `Descuento aplicado a "${updated.name}".`);
      setIsPickerOpen(false);
    } catch {
      showToast('error', 'No se pudo aplicar el descuento.');
    } finally {
      setIsApplying(false);
    }
  };

  /** Confirma el retiro del descuento del producto seleccionado (lo pone en 0). */
  const handleConfirmRemove = async () => {
    if (!productToRemove) return;
    setIsRemoving(true);
    try {
      const updated = await productService.update(productToRemove.id, {
        discountValue: 0,
      });
      upsertProduct(updated);
      showToast('success', `Descuento retirado de "${updated.name}".`);
      setProductToRemove(null);
    } catch {
      showToast('error', 'No se pudo retirar el descuento.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div
      className="rounded-[var(--radius-md)] border"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* ── Encabezado ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
          style={{
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent-vivid, var(--accent))',
          }}
        >
          <Tag size={20} />
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
            Descuentos por producto
          </h3>
          <p
            className="mt-0.5 text-[0.8rem] sm:text-[var(--text-sm)]"
            style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }}
          >
            {isLoading
              ? 'Cargando productos…'
              : `${discountedProducts.length} con descuento activo.`}
          </p>
        </div>
      </div>

      <div
        className="mx-4 h-px sm:mx-6"
        style={{ backgroundColor: 'var(--border-color)' }}
      />

      <div className="p-4 sm:p-6">
        {/* Estados */}
        {isLoading ? (
          <p
            className="flex items-center gap-2 py-6"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            <Loader size={16} className="animate-spin" /> Cargando productos…
          </p>
        ) : loadError ? (
          <p
            className="py-6"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--danger, #c0392b)',
            }}
          >
            {loadError}
          </p>
        ) : discountedProducts.length === 0 ? (
          <p
            className="py-6 text-center"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            Aún no hay productos con descuento. Pulsa "Agregar descuento" para
            asignar uno.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {discountedProducts.map((product) => (
              <DiscountRow
                key={product.id}
                product={product}
                onSaved={upsertProduct}
                onRequestRemove={() => setProductToRemove(product)}
                showToast={showToast}
              />
            ))}
          </ul>
        )}

        {/* Pie: botón agregar */}
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            disabled={isLoading || loadError !== null}
            className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[0.82rem] sm:text-[var(--text-sm)] transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--accent-text)',
              backgroundColor: 'var(--accent-vivid, var(--accent))',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
            }}
          >
            <Plus size={14} aria-hidden="true" />
            Agregar descuento
          </button>
        </div>
      </div>

      {/* ── Modal selector de producto ───────────────────────────────────── */}
      <DiscountProductPickerModal
        isOpen={isPickerOpen}
        excludedProductIds={excludedProductIds}
        isSubmitting={isApplying}
        onClose={() => setIsPickerOpen(false)}
        onApply={(productId, discountValue) =>
          void handleApplyFromModal(productId, discountValue)
        }
      />

      {/* ── Confirmación para retirar un descuento ───────────────────────── */}
      <ConfirmModal
        isOpen={productToRemove !== null}
        variant="danger"
        title="¿Retirar el descuento?"
        message={
          productToRemove
            ? `"${productToRemove.name}" volverá a mostrarse a su precio normal de ${formatPrice(productToRemove.calculatedPrice)}.`
            : ''
        }
        confirmLabel="Sí, retirar"
        cancelLabel="Cancelar"
        isLoading={isRemoving}
        onConfirm={() => void handleConfirmRemove()}
        onCancel={() => setProductToRemove(null)}
      />
    </div>
  );
};

// ─── Fila de descuento ──────────────────────────────────────────────────────

interface DiscountRowProps {
  product: Product;
  onSaved: (updated: Product) => void;
  /** Pide retirar el descuento — el padre confirma antes de aplicar. */
  onRequestRemove: () => void;
  showToast: (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
  ) => void;
}

/**
 * Fila de un producto con descuento activo. Permite **modificar** el valor
 * inline (input con miles en vivo + "Guardar") o **quitarlo** ("Quitar", que
 * delega en el padre para confirmar antes de poner el descuento en 0).
 *
 * @internal
 */
const DiscountRow = ({
  product,
  onSaved,
  onRequestRemove,
  showToast,
}: DiscountRowProps) => {
  /** Dígitos crudos del input (sin separadores). */
  const [digits, setDigits] = useState<string>(
    product.discountValue > 0 ? String(product.discountValue) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * El descuento no cambió respecto al valor guardado: "Guardar" se deshabilita
   * para no disparar updates inútiles. `Number('')` es `0`, que difiere del
   * descuento activo (> 0), así que vaciar el campo sí cuenta como cambio.
   */
  const isUnchanged = Number(digits) === product.discountValue;

  const handleApply = async () => {
    const parsed = Number(digits);
    if (digits.trim() === '' || !Number.isFinite(parsed) || parsed <= 0) {
      setError('Ingresa un valor mayor a 0.');
      return;
    }
    if (parsed > product.calculatedPrice) {
      setError('No puede superar el precio actual.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await productService.update(product.id, {
        discountValue: parsed,
      });
      onSaved(updated);
      setDigits(String(parsed));
      showToast('success', `Descuento actualizado en "${product.name}".`);
    } catch {
      showToast('error', 'No se pudo guardar el descuento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <li
      className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border p-2.5"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <img
        src={resolveThumb(product.images ?? [])}
        alt={product.name}
        className="h-11 w-11 flex-shrink-0 rounded-[var(--radius-sm)] object-cover"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
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
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ textDecoration: 'line-through' }}>
            {formatPrice(product.calculatedPrice)}
          </span>{' '}
          <span
            style={{
              color: 'var(--text-accent)',
              fontWeight: 'var(--font-semibold)',
            }}
          >
            {formatPrice(product.finalPrice)}
          </span>
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <div className="flex flex-col sm:w-32">
          <DiscountAmountInput
            value={digits}
            disabled={isSaving}
            hasError={error !== null}
            onChange={(next) => {
              setDigits(next);
              setError(null);
            }}
          />
          {error && (
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.7rem',
                color: 'var(--danger, #c0392b)',
                marginTop: 2,
              }}
            >
              {error}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={isSaving || isUnchanged}
            className="flex-1 cursor-pointer px-3 py-2 text-[var(--text-sm)] whitespace-nowrap transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--accent-text)',
              backgroundColor: 'var(--accent)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
            }}
          >
            {isSaving ? '…' : 'Guardar'}
          </button>

          <button
            type="button"
            onClick={onRequestRemove}
            disabled={isSaving}
            className="flex-1 cursor-pointer px-3 py-2 text-[var(--text-sm)] whitespace-nowrap transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
              backgroundColor: 'transparent',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            Quitar
          </button>
        </div>
      </div>
    </li>
  );
};
