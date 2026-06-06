/**
 * @file product-edit-form.tsx
 * @description Modal de edición de una joya existente para el panel de
 * administración de Joyería KOB.
 *
 * ## Funcionalidades (paridad con product-create-form)
 * - Carga los valores actuales del producto al abrir.
 * - Selector de categoría en dos pasos pre-inicializado con la categoría actual.
 * - Editor de especificaciones dinámico (`SpecEditor`) pre-cargado.
 * - Precio recalculado en tiempo real usando el precio real del oro del store.
 * - Campo "valor adicional" (`AdditionalValueField`) con prefijo COP y formateo
 *   de miles en tiempo real.
 * - Gestión de imágenes: conservar, quitar (marcar para eliminar) y restaurar
 *   las existentes; agregar nuevas con clic o drag & drop (`ImageDropzone`).
 * - Validaciones inline + barra de acciones sticky con resumen de errores
 *   (`ProductFormActions`) y scroll automático al primer error.
 * - `ConfirmModal` para descartar cambios sin guardar.
 *
 * ## Resolución de categoría al cargar
 * Se usa `product.category.parentId` para determinar si el `categoryId` del
 * producto corresponde a una subcategoría o a una categoría raíz, e inicializar
 * el selector de dos pasos correctamente sin peticiones adicionales al backend.
 *
 * ## Lógica de imágenes existentes
 * - `existingImages` → nombres de las imágenes que se conservarán.
 * - `imagesToDelete` → nombres marcados para eliminar en el PUT.
 * - `newImages`      → archivos nuevos que se agregarán.
 * - El total (`existingImages.length + newImages.length`) no puede superar 5.
 *
 * ## Piezas compartidas
 * La lógica común con `product-create-form` vive en `./product-form/*` y en el
 * hook `useScrollToFirstError`, para no duplicarla ni desincronizarla.
 */

import { useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { useCategorySelector } from '../hooks/use-category-selector';
import { useScrollToFirstError } from '../hooks/use-scroll-to-first-error';
import { useGoldPriceStore } from '@/store/gold-price.store';
import { useToastStore } from '@/store/toast.store';
import { SERVER_URL } from '@/api/server-url';
import { productService } from '../services/product.service';
import type { Product } from '../types/product.types';

import {
  INPUT_BASE,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGES,
  MAX_IMAGE_SIZE_MB,
  MAX_NAME_LENGTH,
} from './product-form/constants';
import {
  buildSpecifications,
  generateId,
  specsToEntries,
  validateImageFiles,
  type ProductFormErrors,
  type SpecEntry,
} from './product-form/utils';
import { Field } from './product-form/field';
import { AdditionalValueField } from './product-form/additional-value-field';
import { SpecEditor } from './product-form/spec-editor';
import { ImageDropzone } from './product-form/image-dropzone';
import { ProductFormActions } from './product-form/form-actions';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface EditFormState {
  name: string;
  description: string;
  baseWeight: string;
  /** Solo dígitos. El formato visual se aplica en render. */
  additionalValue: string;
  stock: string;
}

interface NewImagePreview {
  file: File;
  previewUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM: EditFormState = {
  name: '',
  description: '',
  baseWeight: '',
  additionalValue: '',
  stock: '',
};

/** Prefijo de los `id` de los campos, usado por el scroll-a-error. */
const ID_PREFIX = 'edit';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductEditFormProps {
  /** Producto a editar. `null` cuando el modal está cerrado. */
  product: Product | null;
  /** Controla la visibilidad del modal. */
  isOpen: boolean;
  /** Callback al cerrar o cancelar. */
  onClose: () => void;
  /** Callback tras una edición exitosa. */
  onSuccess: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Modal de edición de joya.
 * Se resetea completamente cada vez que se abre con un producto diferente.
 */
export const ProductEditForm = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}: ProductEditFormProps) => {
  // ── Estado del formulario ──────────────────────────────────────────────────
  const [form, setForm] = useState<EditFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ── Estado de imágenes ─────────────────────────────────────────────────────
  /** Nombres de imágenes existentes que se conservarán. */
  const [existingImages, setExistingImages] = useState<string[]>([]);
  /** Nombres de imágenes marcadas para eliminar en el backend. */
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  /** Archivos nuevos a agregar. */
  const [newImages, setNewImages] = useState<NewImagePreview[]>([]);

  // ── Especificaciones ───────────────────────────────────────────────────────
  const [specEntries, setSpecEntries] = useState<SpecEntry[]>([]);

  // ── Stores y utilidades ────────────────────────────────────────────────────
  const {
    goldPricePerGram,
    isLoading: isLoadingGold,
    loadGoldPrice,
  } = useGoldPriceStore();
  const { showToast } = useToastStore();
  const scrollToFirstError = useScrollToFirstError();

  // ── Selector de categoría ──────────────────────────────────────────────────
  const {
    categories,
    isLoadingCategories,
    categoriesError,
    selectedParentId,
    selectedSubId,
    subCategories,
    resolvedCategoryId,
    selectParent,
    selectSub,
    initializeWith,
  } = useCategorySelector();

  // ── Inicialización al abrir ────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !product) {
      setForm(EMPTY_FORM);
      setErrors({});
      setExistingImages([]);
      setImagesToDelete([]);
      setNewImages([]);
      setSpecEntries([]);
      return;
    }

    // Poblar campos del formulario
    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      baseWeight: String(product.baseWeight ?? ''),
      additionalValue: String(product.additionalValue ?? ''),
      stock: String(product.stock ?? ''),
    });

    setExistingImages(product.images ?? []);
    setImagesToDelete([]);
    setNewImages([]);

    // Poblar especificaciones
    setSpecEntries(
      product.specifications && Object.keys(product.specifications).length > 0
        ? specsToEntries(product.specifications)
        : [],
    );

    // Inicializar selector de categoría usando los datos del backend
    if (product.category) {
      if (product.category.parentId === null) {
        // La categoría del producto es raíz
        initializeWith(product.category.id, null);
      } else {
        // La categoría del producto es subcategoría → parentId es el padre
        initializeWith(product.category.parentId, product.category.id);
      }
    }
    // `initializeWith` se omite a propósito: no está memoizado, así que
    // incluirlo dispararía este efecto en cada render y reinicializaría el
    // formulario, descartando lo que el usuario va editando. Solo debe correr
    // al abrir el modal o cambiar de producto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  // Cargar precio del oro al abrir
  useEffect(() => {
    if (isOpen) void loadGoldPrice();
  }, [isOpen, loadGoldPrice]);

  // Bloquear scroll de fondo mientras el modal esté abierto
  useEffect(() => {
    const scrollRoot = document.getElementById('admin-content');

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (scrollRoot) scrollRoot.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (scrollRoot) scrollRoot.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      if (scrollRoot) scrollRoot.style.overflow = '';
    };
  }, [isOpen]);

  // Revocar URLs de objeto al cerrar o cambiar lista
  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [newImages]);

  // ── Valores parseados ──────────────────────────────────────────────────────
  const parsedValues = useMemo(
    () => ({
      baseWeight: parseFloat(form.baseWeight),
      additionalValue: parseFloat(form.additionalValue),
      stock: parseInt(form.stock, 10),
    }),
    [form],
  );

  /** Total de imágenes que quedará tras los cambios actuales. */
  const totalImages = existingImages.length + newImages.length;

  // ── Precio estimado en tiempo real ─────────────────────────────────────────
  const estimatedPrice = useMemo(() => {
    if (goldPricePerGram == null) return null;
    const { baseWeight, additionalValue } = parsedValues;
    if (Number.isNaN(baseWeight) || Number.isNaN(additionalValue)) return null;
    return baseWeight * goldPricePerGram + additionalValue;
  }, [parsedValues, goldPricePerGram]);

  // ── Detección de cambios ───────────────────────────────────────────────────
  const hasChanges = useMemo(() => {
    if (!product) return false;
    return (
      form.name.trim() !== product.name ||
      form.description.trim() !== product.description ||
      parsedValues.baseWeight !== Number(product.baseWeight) ||
      parsedValues.additionalValue !== Number(product.additionalValue) ||
      parsedValues.stock !== product.stock ||
      resolvedCategoryId !== product.categoryId ||
      imagesToDelete.length > 0 ||
      newImages.length > 0 ||
      // Comparar specs serializado para detectar cambios
      JSON.stringify(buildSpecifications(specEntries)) !==
        JSON.stringify(product.specifications)
    );
  }, [
    form,
    parsedValues,
    product,
    resolvedCategoryId,
    imagesToDelete,
    newImages,
    specEntries,
  ]);

  // ── Manejo del cierre ──────────────────────────────────────────────────────

  const handleRequestClose = () => {
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowCancelConfirm(false);
    newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    onClose();
  };

  // ── Actualización de campos ────────────────────────────────────────────────

  const updateField = (field: keyof EditFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ProductFormErrors])
      setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Gestión de imágenes existentes ────────────────────────────────────────

  /**
   * Marca una imagen existente para eliminar (la quita de `existingImages`
   * y la agrega a `imagesToDelete`).
   */
  const handleRemoveExistingImage = (imageName: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageName));
    setImagesToDelete((prev) =>
      prev.includes(imageName) ? prev : [...prev, imageName],
    );
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  /**
   * Restaura una imagen marcada para eliminar (la devuelve a `existingImages`
   * y la quita de `imagesToDelete`).
   */
  const handleRestoreExistingImage = (imageName: string) => {
    setImagesToDelete((prev) => prev.filter((img) => img !== imageName));
    setExistingImages((prev) =>
      prev.includes(imageName) ? prev : [...prev, imageName],
    );
  };

  // ── Gestión de imágenes nuevas ─────────────────────────────────────────────

  /**
   * Procesa los archivos recibidos del `ImageDropzone` (clic o drop): valida
   * tipo/tamaño/cupo con la utilidad compartida y genera previews.
   */
  const handleNewFilesSelected = (files: File[]) => {
    const availableSlots = MAX_IMAGES - totalImages;
    const { accepted, error, overflow } = validateImageFiles(
      files,
      availableSlots,
    );

    if (error) {
      setErrors((prev) => ({ ...prev, images: error }));
      return;
    }

    const previews: NewImagePreview[] = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...previews]);
    setErrors((prev) => ({ ...prev, images: undefined }));

    if (overflow > 0) {
      showToast(
        'info',
        `Solo se agregaron ${accepted.length} imagen(es). Límite alcanzado.`,
      );
    }
  };

  /** Elimina una imagen nueva de la lista y revoca su URL de objeto. */
  const handleRemoveNewImage = (previewUrl: string) => {
    setNewImages((prev) => {
      const toRemove = prev.find((img) => img.previewUrl === previewUrl);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((img) => img.previewUrl !== previewUrl);
    });
  };

  // ── Gestión de especificaciones ────────────────────────────────────────────

  const addSpecEntry = () => {
    setSpecEntries((prev) => [
      ...prev,
      { id: generateId(), key: '', value: '' },
    ]);
  };

  const updateSpecEntry = (
    id: string,
    field: 'key' | 'value',
    value: string,
  ) => {
    setSpecEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
    if (errors.specs) setErrors((prev) => ({ ...prev, specs: undefined }));
  };

  const removeSpecEntry = (id: string) => {
    setSpecEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ── Validación ─────────────────────────────────────────────────────────────

  /**
   * Valida todos los campos, guarda los errores en estado y los devuelve para
   * que `handleSubmit` pueda desplazarse al primer error inmediatamente.
   */
  const validateForm = (): ProductFormErrors => {
    const next: ProductFormErrors = {};

    if (!form.name.trim()) {
      next.name = 'El nombre es obligatorio.';
    } else if (form.name.trim().length > MAX_NAME_LENGTH) {
      next.name = `Máximo ${MAX_NAME_LENGTH} caracteres.`;
    }

    if (!form.description.trim()) {
      next.description = 'La descripción es obligatoria.';
    } else if (form.description.trim().length > MAX_DESCRIPTION_LENGTH) {
      next.description = `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`;
    }

    if (resolvedCategoryId === null) {
      next.categoryId = 'Debes seleccionar al menos una categoría principal.';
    }

    if (form.baseWeight === '') {
      next.baseWeight = 'El peso es obligatorio.';
    } else if (Number.isNaN(parsedValues.baseWeight)) {
      next.baseWeight = 'Debe ser un número válido.';
    } else if (parsedValues.baseWeight <= 0) {
      next.baseWeight = 'El peso debe ser mayor a 0.';
    }

    if (form.additionalValue === '') {
      next.additionalValue = 'El valor adicional es obligatorio.';
    } else if (Number.isNaN(parsedValues.additionalValue)) {
      next.additionalValue = 'Debe ser un número válido.';
    } else if (parsedValues.additionalValue < 0) {
      next.additionalValue = 'No puede ser negativo.';
    }

    if (form.stock === '') {
      next.stock = 'El stock es obligatorio.';
    } else if (Number.isNaN(parsedValues.stock)) {
      next.stock = 'Debe ser un entero válido.';
    } else if (
      !Number.isInteger(parsedValues.stock) ||
      parsedValues.stock < 0
    ) {
      next.stock = 'Debe ser un entero ≥ 0.';
    }

    if (totalImages === 0) {
      next.images = 'Debes conservar o agregar al menos una imagen.';
    } else if (totalImages > MAX_IMAGES) {
      next.images = `No puedes superar ${MAX_IMAGES} imágenes en total.`;
    }

    const keys = specEntries
      .filter((e) => e.key.trim() || e.value.trim())
      .map((e) => e.key.trim());

    if (keys.length !== new Set(keys).size) {
      next.specs = 'Hay detalles de especificación duplicados.';
    } else if (specEntries.some((e) => e.key.trim() && !e.value.trim())) {
      next.specs = 'Cada detalle debe tener un valor.';
    } else if (specEntries.some((e) => !e.key.trim() && e.value.trim())) {
      next.specs = 'Cada valor debe tener un detalle.';
    }

    setErrors(next);
    return next;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;

    const next = validateForm();
    if (Object.keys(next).length > 0) {
      scrollToFirstError(next, ID_PREFIX);
      return;
    }
    if (!hasChanges) {
      showToast('info', 'No hay cambios para guardar.');
      return;
    }

    try {
      setSaving(true);
      await productService.update(product.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: resolvedCategoryId ?? undefined,
        baseWeight: parsedValues.baseWeight,
        additionalValue: parsedValues.additionalValue,
        stock: parsedValues.stock,
        specifications: buildSpecifications(specEntries),
        imageFiles: newImages.map((img) => img.file),
        imagesToDelete,
      });
      showToast('success', 'Joya actualizada correctamente.');
      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      onSuccess();
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === 'string'
          ? (error as { response: { data: { message: string } } }).response.data
              .message
          : 'No se pudo actualizar el producto. Intenta de nuevo.';
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isOpen || !product) return null;

  // Imágenes existentes ordenadas según el array original del producto
  const orderedVisible = (product.images ?? []).filter((img) =>
    existingImages.includes(img),
  );
  const orderedDeleted = (product.images ?? []).filter((img) =>
    imagesToDelete.includes(img),
  );

  /**
   * Nº de campos con error. Se cuentan solo los errores con MENSAJE definido,
   * no las claves del objeto: al resolver un error lo marcamos como `undefined`
   * (sin borrar la clave), por lo que `Object.keys(errors).length` seguiría
   * contándolo. Filtrar por valor logra que el resumen no aparezca al subir una
   * imagen (que limpia `errors.images`) y que el conteo baje al completar campos.
   */
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <>
      {/* ── Modal principal ──────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--bg-overlay)] p-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-form-title"
      >
        <div className="w-full max-w-4xl rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-[var(--shadow-xl)]">
          {/* Encabezado */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                id="edit-form-title"
                className="text-2xl font-semibold text-[var(--text-primary)]"
              >
                Editar joya
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Modifica los datos de{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {product.name}
                </span>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Cerrar formulario"
              className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)] active:scale-95 cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-8"
            noValidate
          >
            {/* ── Sección 1: Información básica ────────────────────── */}
            <section aria-labelledby="edit-section-basic">
              <h3
                id="edit-section-basic"
                className="mb-4 text-base font-semibold text-[var(--text-primary)]"
              >
                Información básica
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <Field
                    label="Nombre"
                    required
                    htmlFor={`${ID_PREFIX}-name`}
                    error={errors.name}
                  >
                    <input
                      id={`${ID_PREFIX}-name`}
                      type="text"
                      value={form.name}
                      maxLength={MAX_NAME_LENGTH}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Ej: Anillo Solitario Zafiro Real"
                      className={INPUT_BASE}
                    />
                    <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
                      {form.name.length}/{MAX_NAME_LENGTH}
                    </p>
                  </Field>
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <Field
                    label="Descripción"
                    required
                    htmlFor={`${ID_PREFIX}-description`}
                    error={errors.description}
                  >
                    <textarea
                      id={`${ID_PREFIX}-description`}
                      value={form.description}
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      rows={4}
                      onChange={(e) =>
                        updateField('description', e.target.value)
                      }
                      placeholder="Ej: Anillo en oro blanco de 18k con zafiro central."
                      className={`${INPUT_BASE} resize-none`}
                    />
                    <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
                      {form.description.length}/{MAX_DESCRIPTION_LENGTH}
                    </p>
                  </Field>
                </div>

                {/* Peso */}
                <Field
                  label="Peso (gramos)"
                  required
                  htmlFor={`${ID_PREFIX}-baseWeight`}
                  error={errors.baseWeight}
                  hint="Admite decimales. Ej: 4.5"
                >
                  <input
                    id={`${ID_PREFIX}-baseWeight`}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.baseWeight}
                    onChange={(e) => updateField('baseWeight', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="4.5"
                    className={INPUT_BASE}
                  />
                </Field>

                {/* Valor adicional con prefijo COP y formato en tiempo real */}
                <Field
                  label="Valor adicional (COP)"
                  required
                  htmlFor={`${ID_PREFIX}-additionalValue`}
                  error={errors.additionalValue}
                  hint="Se formatea automáticamente mientras escribes."
                >
                  <AdditionalValueField
                    id={`${ID_PREFIX}-additionalValue`}
                    value={form.additionalValue}
                    onChange={(digits) =>
                      updateField('additionalValue', digits)
                    }
                  />
                </Field>

                {/* Stock */}
                <div className="md:col-span-2">
                  <Field
                    label="Stock"
                    required
                    htmlFor={`${ID_PREFIX}-stock`}
                    error={errors.stock}
                    hint="Número entero de unidades disponibles."
                  >
                    <input
                      id={`${ID_PREFIX}-stock`}
                      type="number"
                      step="1"
                      min="0"
                      value={form.stock}
                      onChange={(e) => updateField('stock', e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="5"
                      className={INPUT_BASE}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* ── Sección 2: Precio estimado ───────────────────────── */}
            <section
              aria-labelledby="edit-section-price"
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4"
            >
              <h3
                id="edit-section-price"
                className="mb-3 text-base font-semibold text-[var(--text-primary)]"
              >
                Precio
              </h3>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-8">
                {/* Precio actual guardado */}
                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Precio guardado actualmente
                  </p>
                  <p className="text-lg font-semibold text-[var(--text-secondary)]">
                    ${Number(product.calculatedPrice).toLocaleString('es-CO')}{' '}
                    COP
                  </p>
                </div>

                {/* Precio del oro */}
                {isLoadingGold ? (
                  <p className="text-sm text-[var(--text-muted)]">
                    Cargando precio del oro...
                  </p>
                ) : goldPricePerGram == null ? (
                  <p className="text-sm text-red-500">
                    No se pudo obtener el precio del oro.
                  </p>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Oro/gramo actual
                      </p>
                      <p className="text-sm font-medium text-[var(--text-secondary)]">
                        ${goldPricePerGram.toLocaleString('es-CO')} COP/g
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Nuevo precio estimado
                      </p>
                      <p className="text-2xl font-bold text-[var(--text-accent)]">
                        {estimatedPrice !== null
                          ? `$${Math.round(estimatedPrice).toLocaleString('es-CO')} COP`
                          : '—'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* ── Sección 3: Categoría ─────────────────────────────── */}
            <section aria-labelledby="edit-section-category">
              <h3
                id="edit-section-category"
                className="mb-4 text-base font-semibold text-[var(--text-primary)]"
              >
                Categoría
                <span className="ml-1 text-red-500" aria-hidden="true">
                  *
                </span>
              </h3>

              {categoriesError ? (
                <p className="text-sm text-red-500">{categoriesError}</p>
              ) : isLoadingCategories ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Cargando categorías...
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Paso 1 */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={`${ID_PREFIX}-categoryId`}
                      className="text-sm font-medium text-[var(--text-primary)]"
                    >
                      Categoría principal
                    </label>
                    <select
                      id={`${ID_PREFIX}-categoryId`}
                      value={selectedParentId ?? ''}
                      onChange={(e) => {
                        selectParent(
                          e.target.value === '' ? null : Number(e.target.value),
                        );
                        if (errors.categoryId)
                          setErrors((prev) => ({
                            ...prev,
                            categoryId: undefined,
                          }));
                      }}
                      className={`${INPUT_BASE} cursor-pointer bg-[var(--bg-secondary)]`}
                    >
                      <option
                        value=""
                        className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                      >
                        Selecciona una categoría
                      </option>
                      {categories.map((cat) => (
                        <option
                          key={cat.id}
                          value={cat.id}
                          className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                        >
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paso 2 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--text-primary)]">
                      Subcategoría{' '}
                      <span className="font-normal text-[var(--text-muted)]">
                        (opcional)
                      </span>
                    </label>

                    {selectedParentId === null ? (
                      <div className="flex h-[50px] items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4">
                        <p className="text-sm text-[var(--text-muted)]">
                          Primero selecciona una categoría principal
                        </p>
                      </div>
                    ) : subCategories.length === 0 ? (
                      <div className="flex h-[50px] items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4">
                        <p className="text-sm text-[var(--text-muted)]">
                          Esta categoría no tiene subcategorías
                        </p>
                      </div>
                    ) : (
                      <select
                        value={selectedSubId ?? ''}
                        onChange={(e) =>
                          selectSub(
                            e.target.value === ''
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        className={`${INPUT_BASE} cursor-pointer bg-[var(--bg-secondary)]`}
                      >
                        <option
                          value=""
                          className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                        >
                          Sin subcategoría
                        </option>
                        {subCategories.map((sub) => (
                          <option
                            key={sub.id}
                            value={sub.id}
                            className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                          >
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {errors.categoryId && (
                <p className="mt-2 text-xs text-red-500" role="alert">
                  {errors.categoryId}
                </p>
              )}
            </section>

            {/* ── Sección 4: Especificaciones ──────────────────────── */}
            <SpecEditor
              id={`${ID_PREFIX}-specs`}
              entries={specEntries}
              error={errors.specs}
              onAdd={addSpecEntry}
              onUpdate={updateSpecEntry}
              onRemove={removeSpecEntry}
            />

            {/* ── Sección 5: Imágenes ──────────────────────────────── */}
            <section aria-labelledby="edit-section-images">
              <div className="mb-4">
                <h3
                  id="edit-section-images"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  Imágenes
                  <span className="ml-1 text-red-500" aria-hidden="true">
                    *
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Entre 1 y {MAX_IMAGES} imágenes en total. JPG, PNG o WEBP.
                  Máx. {MAX_IMAGE_SIZE_MB} MB por imagen.
                </p>
              </div>

              {/* Contador global */}
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">
                  Total de imágenes
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    totalImages === 0
                      ? 'bg-red-500/10 text-red-500'
                      : totalImages === MAX_IMAGES
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-[var(--accent-subtle)] text-[var(--text-accent)]'
                  }`}
                >
                  {totalImages}/{MAX_IMAGES}
                </span>
              </div>

              {/* Imágenes existentes — conservar */}
              {orderedVisible.length > 0 && (
                <div className="mb-4">
                  <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
                    Imágenes actuales (se conservarán)
                  </p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {orderedVisible.map((imageName) => (
                      <div
                        key={imageName}
                        className="overflow-hidden rounded-2xl border border-[var(--border-color)] transition hover:border-[var(--border-strong)]"
                      >
                        <img
                          src={`${SERVER_URL}/uploads/products/${imageName}`}
                          alt={product.name}
                          className="h-32 w-full object-cover"
                        />
                        <div className="p-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(imageName)}
                            className="w-full rounded-lg bg-red-500 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-red-600 active:scale-95 cursor-pointer"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imágenes marcadas para eliminar */}
              {orderedDeleted.length > 0 && (
                <div className="mb-4">
                  <p className="mb-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                    Marcadas para eliminar
                  </p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {orderedDeleted.map((imageName) => (
                      <div
                        key={imageName}
                        className="overflow-hidden rounded-2xl border border-red-500/40 opacity-60 transition hover:opacity-80"
                      >
                        <img
                          src={`${SERVER_URL}/uploads/products/${imageName}`}
                          alt={product.name}
                          className="h-32 w-full object-cover"
                        />
                        <div className="p-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRestoreExistingImage(imageName)
                            }
                            className="w-full rounded-lg border border-[var(--border-color)] px-2 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] active:scale-95"
                          >
                            Restaurar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nuevas imágenes */}
              {newImages.length > 0 && (
                <div className="mb-4">
                  <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
                    Nuevas imágenes
                  </p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {newImages.map((img) => (
                      <div
                        key={img.previewUrl}
                        className="overflow-hidden rounded-2xl border border-[var(--accent)]/30 transition hover:border-[var(--accent)]/60"
                      >
                        <img
                          src={img.previewUrl}
                          alt={`Preview ${img.file.name}`}
                          className="h-32 w-full object-cover"
                        />
                        <div className="p-2">
                          <p
                            className="truncate text-xs text-[var(--text-muted)]"
                            title={img.file.name}
                          >
                            {img.file.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(img.previewUrl)}
                            className="mt-1 w-full rounded-lg bg-red-500 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-red-600 active:scale-95"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zona de carga (clic o drag & drop) */}
              {totalImages < MAX_IMAGES && (
                <ImageDropzone
                  id={`${ID_PREFIX}-images`}
                  remaining={MAX_IMAGES - totalImages}
                  onFiles={handleNewFilesSelected}
                />
              )}

              {errors.images && (
                <p className="mt-2 text-xs text-red-500" role="alert">
                  {errors.images}
                </p>
              )}
            </section>

            {/* ── Acciones (sticky con resumen de errores) ─────────── */}
            <ProductFormActions
              saving={saving}
              submitLabel="Guardar cambios"
              savingLabel="Guardando..."
              errorCount={errorCount}
              onCancel={handleRequestClose}
              submitDisabled={!hasChanges}
            />
          </form>
        </div>
      </div>

      {/* ── ConfirmModal de descarte ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        variant="danger"
        title="¿Descartar cambios?"
        message="Los cambios realizados se perderán y la joya quedará sin modificaciones."
        confirmLabel="Sí, descartar"
        cancelLabel="Seguir editando"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </>
  );
};
