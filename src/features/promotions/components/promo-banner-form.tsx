/**
 * @file promo-banner-form.tsx
 * @description Formulario de creación/edición de un banner de promoción del
 * carrusel hero. Sigue el patrón de subida de imagen de `hero-banner-card.tsx`
 * (File + `URL.createObjectURL` para previsualización) y la validación inline
 * de `category-form.tsx`.
 *
 * El destino del banner (`linkType`) puede ser:
 * - PRODUCT  → se elige un producto (abre su detalle en el catálogo).
 * - CATEGORY → se elige una categoría (filtra el catálogo).
 * - NONE     → banner informativo sin navegación.
 */

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Check,
  FolderTree,
  Image as ImageIcon,
  Loader,
  Package,
  Save,
  Search,
} from 'lucide-react';
import { SERVER_URL } from '@/api/server-url';
import { useCategoryStore } from '@/store/category.store';
import { productService } from '@/features/catalog/services/product.service';
import type { Product } from '@/features/catalog/types/product.types';
import type {
  PromoBanner,
  PromoLinkType,
} from '../types/promotion.types';

/** Formatos de imagen aceptados por el input file. */
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

/** Valores normalizados que emite el formulario al guardar. */
export interface PromoBannerFormValues {
  title: string;
  subtitle: string;
  linkType: PromoLinkType;
  linkProductId: string | null;
  linkCategoryId: number | null;
  /** `null` en edición si no se cambió la imagen. */
  imageFile: File | null;
}

interface PromoBannerFormProps {
  mode: 'create' | 'edit';
  initial?: PromoBanner;
  isSaving: boolean;
  onSubmit: (values: PromoBannerFormValues) => void;
  onCancel: () => void;
}

const LINK_OPTIONS: {
  value: PromoLinkType;
  label: string;
  description: string;
  Icon: typeof ImageIcon;
}[] = [
  {
    value: 'NONE',
    label: 'Solo imagen',
    description: 'Sin enlace',
    Icon: ImageIcon,
  },
  {
    value: 'PRODUCT',
    label: 'Producto',
    description: 'Abre su detalle',
    Icon: Package,
  },
  {
    value: 'CATEGORY',
    label: 'Categoría',
    description: 'Filtra el catálogo',
    Icon: FolderTree,
  },
];

interface OptionRowProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * Fila seleccionable reutilizable para los listados de producto y categoría.
 * Resalta la selección en navy con un check, en lugar del `<option>` nativo.
 */
const OptionRow = ({
  label,
  selected,
  disabled = false,
  onClick,
}: OptionRowProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed"
    style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      fontWeight: selected ? 'var(--font-semibold)' : 'var(--font-normal)',
      color: selected ? 'var(--text-accent)' : 'var(--text-primary)',
      backgroundColor: selected ? 'var(--accent-subtle)' : 'transparent',
      border: 'none',
    }}
  >
    <span className="truncate">{label}</span>
    {selected && (
      <Check
        size={15}
        style={{ color: 'var(--text-accent)', flexShrink: 0 }}
        aria-hidden="true"
      />
    )}
  </button>
);

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
};

export const PromoBannerForm = ({
  mode,
  initial,
  isSaving,
  onSubmit,
  onCancel,
}: PromoBannerFormProps) => {
  const { categories, loadCategories } = useCategoryStore();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [linkType, setLinkType] = useState<PromoLinkType>(
    initial?.linkType ?? 'NONE',
  );
  const [linkProductId, setLinkProductId] = useState<string | null>(
    initial?.linkProductId ?? null,
  );
  const [linkCategoryId, setLinkCategoryId] = useState<number | null>(
    initial?.linkCategoryId ?? null,
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Productos para el selector de destino tipo PRODUCT.
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // Carga la lista de productos para poder elegir el destino y resolver el
  // nombre del producto ya seleccionado en modo edición.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await productService.getAll();
        if (!cancelled) setProducts(list);
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Limpia la object URL de previsualización al desmontar.
  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    setSelectedFile(file);
    setPreviewObjectUrl(URL.createObjectURL(file));
    setValidationError(null);
  };

  // Imagen a mostrar: nueva seleccionada > imagen actual del backend > nada.
  const previewImage =
    previewObjectUrl ??
    (initial ? `${SERVER_URL}${initial.imageUrl}` : null);

  const rootCategories = useMemo(
    () => categories.filter((c) => c.parentId === null),
    [categories],
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === linkProductId) ?? null,
    [products, linkProductId],
  );

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products.slice(0, 8);
    return products
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [products, productSearch]);

  // Opciones de categoría agrupadas por categoría raíz. Cada raíz aporta una
  // opción "Toda la categoría" + sus subcategorías. `search` concatena raíz y
  // sub para que el filtro encuentre por cualquiera de los dos nombres.
  const categoryGroups = useMemo(
    () =>
      rootCategories.map((root) => ({
        root,
        options: [
          { id: root.id, label: 'Toda la categoría', search: root.name },
          ...(root.children ?? []).map((sub) => ({
            id: sub.id,
            label: sub.name,
            search: `${root.name} ${sub.name}`,
          })),
        ],
      })),
    [rootCategories],
  );

  const filteredCategoryGroups = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    if (!term) return categoryGroups;
    return categoryGroups
      .map((group) => {
        // Si el término coincide con la raíz, conserva todas sus opciones.
        const rootMatches = group.root.name.toLowerCase().includes(term);
        return {
          ...group,
          options: rootMatches
            ? group.options
            : group.options.filter((o) =>
                o.search.toLowerCase().includes(term),
              ),
        };
      })
      .filter((group) => group.options.length > 0);
  }, [categoryGroups, categorySearch]);

  // Etiqueta legible (ruta completa) de la categoría seleccionada, para el
  // indicador "Seleccionada:" fuera del listado.
  const selectedCategoryLabel = useMemo(() => {
    if (linkCategoryId === null) return null;
    for (const root of rootCategories) {
      if (root.id === linkCategoryId) return `${root.name} (toda la categoría)`;
      const sub = (root.children ?? []).find((s) => s.id === linkCategoryId);
      if (sub) return `${root.name} › ${sub.name}`;
    }
    return null;
  }, [linkCategoryId, rootCategories]);

  const handleSubmit = () => {
    setValidationError(null);

    if (mode === 'create' && !selectedFile) {
      setValidationError('La imagen del banner es obligatoria.');
      return;
    }
    if (linkType === 'PRODUCT' && !linkProductId) {
      setValidationError('Selecciona el producto de destino.');
      return;
    }
    if (linkType === 'CATEGORY' && linkCategoryId === null) {
      setValidationError('Selecciona la categoría de destino.');
      return;
    }

    onSubmit({
      title: title.trim(),
      subtitle: subtitle.trim(),
      linkType,
      linkProductId: linkType === 'PRODUCT' ? linkProductId : null,
      linkCategoryId: linkType === 'CATEGORY' ? linkCategoryId : null,
      imageFile: selectedFile,
    });
  };

  return (
    <div
      className="rounded-[var(--radius-md)] border p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-accent)',
      }}
    >
      <p
        className="mb-4"
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
        }}
      >
        {mode === 'create' ? 'Nuevo banner de promoción' : 'Editar banner'}
      </p>

      {/* ── Imagen ─────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <label
          className="mb-2 block"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
          }}
        >
          Imagen {mode === 'create' && <span style={{ color: 'var(--danger, #c0392b)' }}>*</span>}
        </label>

        <div
          className="relative mb-3 overflow-hidden"
          style={{
            // Proporción de la franja real del carrusel en escritorio
            // (~1920×580). Mantener en sync con la altura del carrusel en
            // hero-carousel.tsx (height: clamp(420px, 58vh, 580px)) para que
            // el recorte de esta previa coincida con el resultado final.
            aspectRatio: '1920 / 580',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        >
          {previewImage ? (
            <img
              src={previewImage}
              alt="Previsualización del banner"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              Sin imagen seleccionada
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSaving}
          className="inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-[var(--text-sm)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--accent-text)',
            backgroundColor: 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
          }}
        >
          <ImageIcon size={14} aria-hidden="true" />
          {selectedFile || initial ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={handleImageChange}
          className="sr-only"
          aria-label="Seleccionar imagen del banner"
        />
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          Formato recomendado: 1920 × 580 px · JPG, PNG, WebP
        </p>
      </div>

      {/* ── Título ─────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <label
          htmlFor="promo-title"
          className="mb-1.5 block"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
          }}
        >
          Título (opcional)
        </label>
        <input
          id="promo-title"
          type="text"
          value={title}
          maxLength={120}
          disabled={isSaving}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Nueva colección de pulseras"
          className="w-full px-3 py-2.5 text-[var(--text-sm)]"
          style={inputStyle}
        />
      </div>

      {/* ── Subtítulo ──────────────────────────────────────────────────── */}
      <div className="mb-4">
        <label
          htmlFor="promo-subtitle"
          className="mb-1.5 block"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
          }}
        >
          Subtítulo (opcional)
        </label>
        <input
          id="promo-subtitle"
          type="text"
          value={subtitle}
          maxLength={200}
          disabled={isSaving}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Ej: Piezas de oro 18k hechas a mano"
          className="w-full px-3 py-2.5 text-[var(--text-sm)]"
          style={inputStyle}
        />
      </div>

      {/* ── Destino ────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <p
          className="mb-1.5 block"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
          }}
        >
          Al hacer click, el banner lleva a…
        </p>
        <div
          role="radiogroup"
          aria-label="Destino del banner al hacer click"
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {LINK_OPTIONS.map((opt) => {
            const active = linkType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={isSaving}
                onClick={() => {
                  setLinkType(opt.value);
                  setValidationError(null);
                }}
                className="relative flex cursor-pointer flex-col items-start gap-1 px-3 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  border: active
                    ? '1px solid var(--border-accent)'
                    : '1px solid var(--border-color)',
                  backgroundColor: active
                    ? 'var(--accent-subtle)'
                    : 'var(--bg-primary)',
                }}
              >
                {active && (
                  <Check
                    size={14}
                    className="absolute right-2 top-2"
                    style={{ color: 'var(--text-accent)' }}
                    aria-hidden="true"
                  />
                )}
                <opt.Icon
                  size={18}
                  style={{
                    color: active ? 'var(--text-accent)' : 'var(--text-muted)',
                  }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {opt.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de producto (cuando linkType = PRODUCT) */}
      {linkType === 'PRODUCT' && (
        <div className="mb-4">
          <label
            className="mb-1.5 block"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
            }}
          >
            Producto de destino
          </label>
          {selectedProduct && (
            <p
              className="mb-2"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-accent)',
              }}
            >
              Seleccionado: <strong>{selectedProduct.name}</strong>
            </p>
          )}
          <div className="relative mb-2">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
            <input
              type="text"
              value={productSearch}
              disabled={isSaving}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto por nombre…"
              className="w-full py-2.5 pl-9 pr-3 text-[var(--text-sm)]"
              style={inputStyle}
            />
          </div>
          <div
            className="max-h-56 overflow-y-auto rounded-[var(--radius-sm)] border"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {filteredProducts.length === 0 ? (
              <p
                className="px-3 py-2"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                }}
              >
                Sin coincidencias.
              </p>
            ) : (
              filteredProducts.map((p) => (
                <OptionRow
                  key={p.id}
                  label={p.name}
                  selected={p.id === linkProductId}
                  disabled={isSaving}
                  onClick={() => {
                    setLinkProductId(p.id);
                    setValidationError(null);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Selector de categoría (cuando linkType = CATEGORY) */}
      {linkType === 'CATEGORY' && (
        <div className="mb-4">
          <p
            className="mb-1.5 block"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
            }}
          >
            Categoría de destino
          </p>
          {selectedCategoryLabel && (
            <p
              className="mb-2"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-accent)',
              }}
            >
              Seleccionada: <strong>{selectedCategoryLabel}</strong>
            </p>
          )}
          <div className="relative mb-2">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
            <input
              type="text"
              value={categorySearch}
              disabled={isSaving}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Buscar categoría…"
              className="w-full py-2.5 pl-9 pr-3 text-[var(--text-sm)]"
              style={inputStyle}
            />
          </div>
          <div
            className="max-h-56 overflow-y-auto rounded-[var(--radius-sm)] border"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {filteredCategoryGroups.length === 0 ? (
              <p
                className="px-3 py-2"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                }}
              >
                Sin coincidencias.
              </p>
            ) : (
              filteredCategoryGroups.map((group) => (
                <div key={group.root.id}>
                  <p
                    className="sticky top-0 px-3 py-1.5"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-semibold)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wide)',
                    }}
                  >
                    {group.root.name}
                  </p>
                  {group.options.map((opt) => (
                    <OptionRow
                      key={opt.id}
                      label={opt.label}
                      selected={opt.id === linkCategoryId}
                      disabled={isSaving}
                      onClick={() => {
                        setLinkCategoryId(opt.id);
                        setValidationError(null);
                      }}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Error de validación ────────────────────────────────────────── */}
      {validationError && (
        <p
          className="mb-3"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--danger, #c0392b)',
          }}
        >
          {validationError}
        </p>
      )}

      {/* ── Acciones ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="cursor-pointer px-4 py-2.5 text-[var(--text-sm)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[var(--text-sm)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--accent-text)',
            backgroundColor: 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
          }}
        >
          {isSaving ? (
            <>
              <Loader size={14} className="animate-spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            <>
              <Save size={14} aria-hidden="true" />
              {mode === 'create' ? 'Crear banner' : 'Guardar cambios'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
