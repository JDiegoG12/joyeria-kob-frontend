/**
 * @file promo-banner-section.tsx
 * @description Sección del panel de promociones para gestionar los banners del
 * carrusel hero: listar, crear, editar, reordenar (flechas) y eliminar.
 *
 * El banner principal del carrusel se configura en `/admin/general`; estos
 * banners son los slides adicionales que van SIEMPRE después de él.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader,
  Pencil,
  Trash2,
} from 'lucide-react';
import { SERVER_URL } from '@/api/server-url';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { useToastStore } from '@/store/toast.store';
import { usePromoBannerStore } from '@/store/promo-banner.store';
import { MAX_PROMO_BANNERS } from '../types/promotion.types';
import type { PromoBanner } from '../types/promotion.types';
import { PromoBannerForm, type PromoBannerFormValues } from './promo-banner-form';

const LINK_LABEL: Record<PromoBanner['linkType'], string> = {
  PRODUCT: 'Enlaza a un producto',
  CATEGORY: 'Enlaza a una categoría',
  NONE: 'Solo imagen',
};

type FormState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; banner: PromoBanner };

export const PromoBannerSection = () => {
  const {
    banners,
    isFetching,
    fetchError,
    isSaving,
    fetchBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    reorderBanners,
  } = usePromoBannerStore();
  const { showToast } = useToastStore();

  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [pendingDelete, setPendingDelete] = useState<PromoBanner | null>(null);

  useEffect(() => {
    void fetchBanners();
  }, [fetchBanners]);

  const reachedMax = banners.length >= MAX_PROMO_BANNERS;

  const handleSubmit = async (values: PromoBannerFormValues) => {
    if (form.mode === 'create') {
      if (!values.imageFile) return; // La validación del form ya lo cubre.
      const ok = await createBanner({
        title: values.title || undefined,
        subtitle: values.subtitle || undefined,
        linkType: values.linkType,
        linkProductId: values.linkProductId,
        linkCategoryId: values.linkCategoryId,
        imageFile: values.imageFile,
      });
      if (ok) {
        showToast('success', 'Banner de promoción creado correctamente.');
        setForm({ mode: 'closed' });
      } else {
        showToast('error', 'No se pudo crear el banner. Intenta de nuevo.');
      }
      return;
    }

    if (form.mode === 'edit') {
      const ok = await updateBanner(form.banner.id, {
        title: values.title,
        subtitle: values.subtitle,
        linkType: values.linkType,
        linkProductId: values.linkProductId,
        linkCategoryId: values.linkCategoryId,
        ...(values.imageFile ? { imageFile: values.imageFile } : {}),
      });
      if (ok) {
        showToast('success', 'Banner actualizado correctamente.');
        setForm({ mode: 'closed' });
      } else {
        showToast('error', 'No se pudo actualizar el banner. Intenta de nuevo.');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const ok = await deleteBanner(pendingDelete.id);
    if (ok) showToast('success', 'Banner eliminado correctamente.');
    else showToast('error', 'No se pudo eliminar el banner.');
    setPendingDelete(null);
  };

  /** Mueve un banner una posición arriba/abajo y persiste el nuevo orden. */
  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;

    const reordered = [...banners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    const items = reordered.map((b, i) => ({ id: b.id, position: i + 1 }));
    const ok = await reorderBanners(items);
    if (!ok) showToast('error', 'No se pudo reordenar.');
  };

  const isFormOpen = form.mode !== 'closed';

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
          <ImagePlus size={20} />
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
            Banners del carrusel
          </h3>
          <p
            className="mt-0.5 text-[0.8rem] sm:text-[var(--text-sm)]"
            style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }}
          >
            {banners.length}/{MAX_PROMO_BANNERS} · Slides que van después del
            banner principal.
          </p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setForm({ mode: 'create' })}
            disabled={reachedMax}
            className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[0.78rem] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[var(--text-sm)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--accent-text)',
              backgroundColor: 'var(--accent-vivid, var(--accent))',
              border: 'none',
            }}
            title={
              reachedMax
                ? `Máximo ${MAX_PROMO_BANNERS} banners`
                : 'Agregar banner'
            }
          >
            <ImagePlus size={14} aria-hidden="true" />
            Nuevo banner
          </button>
        )}
      </div>

      <div
        className="mx-4 h-px sm:mx-6"
        style={{ backgroundColor: 'var(--border-color)' }}
      />

      {/* ── Contenido ────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6">
        {/* Formulario create/edit */}
        {isFormOpen && (
          <div className="mb-5">
            <PromoBannerForm
              mode={form.mode === 'edit' ? 'edit' : 'create'}
              initial={form.mode === 'edit' ? form.banner : undefined}
              isSaving={isSaving}
              onSubmit={(values) => void handleSubmit(values)}
              onCancel={() => setForm({ mode: 'closed' })}
            />
          </div>
        )}

        {/* Estados de la lista */}
        {isFetching && banners.length === 0 ? (
          <p
            className="flex items-center gap-2 py-6"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            <Loader size={16} className="animate-spin" /> Cargando banners…
          </p>
        ) : fetchError ? (
          <p
            className="py-6"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--danger, #c0392b)',
            }}
          >
            {fetchError}
          </p>
        ) : banners.length === 0 && !isFormOpen ? (
          <p
            className="py-6 text-center"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            Aún no hay banners de promoción. Crea el primero con "Nuevo banner".
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {banners.map((banner, index) => (
              <BannerRow
                key={banner.id}
                banner={banner}
                index={index}
                total={banners.length}
                disabled={isSaving || isFormOpen}
                onEdit={() => setForm({ mode: 'edit', banner })}
                onDelete={() => setPendingDelete(banner)}
                onMove={handleMove}
              />
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        variant="danger"
        title="Eliminar banner"
        message="¿Seguro que deseas eliminar este banner del carrusel? Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        isLoading={isSaving}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

// ─── Fila de banner ─────────────────────────────────────────────────────────

interface BannerRowProps {
  banner: PromoBanner;
  index: number;
  total: number;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

const BannerRow = ({
  banner,
  index,
  total,
  disabled,
  onEdit,
  onDelete,
  onMove,
}: BannerRowProps) => {
  const imageSrc = useMemo(
    () => `${SERVER_URL}${banner.imageUrl}`,
    [banner.imageUrl],
  );

  return (
    <li
      className="flex items-center gap-3 rounded-[var(--radius-sm)] border p-2.5"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Controles de orden */}
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={disabled || index === 0}
          aria-label="Subir banner"
          className="cursor-pointer p-1 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}
        >
          <ArrowUp size={15} />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={disabled || index === total - 1}
          aria-label="Bajar banner"
          className="cursor-pointer p-1 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}
        >
          <ArrowDown size={15} />
        </button>
      </div>

      {/* Miniatura */}
      <div
        className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)]"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <img
          src={imageSrc}
          alt={banner.title ?? 'Banner de promoción'}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
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
          {banner.title || 'Sin título'}
        </p>
        <p
          className="truncate"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          Posición {banner.position} · {LINK_LABEL[banner.linkType]}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          aria-label="Editar banner"
          className="cursor-pointer p-2 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          aria-label="Eliminar banner"
          className="cursor-pointer p-2 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: 'var(--danger, #c0392b)', background: 'none', border: 'none' }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
};
