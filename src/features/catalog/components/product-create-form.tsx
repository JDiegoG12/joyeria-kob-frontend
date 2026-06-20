/**
 * @file product-create-form.tsx
 * @description Modal de creación de una nueva joya para el panel de administración
 * de Joyería KOB.
 *
 * ## Funcionalidades
 * - Selector de categoría en dos pasos: principal → subcategoría opcional.
 * - Editor de especificaciones dinámico (`SpecEditor`) con pares detalle-valor.
 * - Preview del precio estimado en tiempo real con el precio real del oro.
 * - Campo "valor adicional" (`AdditionalValueField`) con prefijo COP y formateo
 *   de miles EN TIEMPO REAL. Su valor por defecto es `0`.
 * - Carga de imágenes con clic o drag & drop real (`ImageDropzone`), preview y
 *   deselección individual (1–5 archivos).
 * - Validaciones inline por campo + barra de acciones sticky con resumen de
 *   errores (`ProductFormActions`) y scroll automático al primer error.
 * - `ConfirmModal` para cancelación con datos ingresados.
 *
 * ## Regla de categoryId
 * Si el usuario selecciona subcategoría → se envía el ID de la subcategoría.
 * Si no → se envía el ID de la categoría principal.
 *
 * ## Piezas compartidas
 * La lógica común con `product-edit-form` vive en `./product-form/*` y en el
 * hook `useScrollToFirstError`, para no duplicarla ni desincronizarla.
 */

import { useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { useCategorySelector } from '../hooks/use-category-selector';
import { useScrollToFirstError } from '../hooks/use-scroll-to-first-error';
import { useGoldPriceStore } from '@/store/gold-price.store';
import { useToastStore } from '@/store/toast.store';
import { productService } from '../services/product.service';

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

interface ProductFormState {
  name: string;
  description: string;
  baseWeight: string;
  /** Almacena solo dígitos como string. El formato visual se aplica en render. */
  additionalValue: string;
  stock: string;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Estado inicial del formulario.
 * `additionalValue: '0'` cumple el requisito de que el valor adicional arranque
 * en 0 (en lugar de vacío) en el formulario de creación.
 */
const EMPTY_FORM: ProductFormState = {
  name: '',
  description: '',
  baseWeight: '',
  additionalValue: '0',
  stock: '',
};

/** Prefijo de los `id` de los campos, usado por el scroll-a-error. */
const ID_PREFIX = 'create';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Modal completo para crear una nueva joya.
 * Se desmonta limpiamente al cerrarse, revocando todas las URLs de objeto.
 */
export const ProductCreateForm = ({
  isOpen,
  onClose,
  onSuccess,
}: ProductCreateFormProps) => {
  // ── Estado del formulario ──────────────────────────────────────────────────
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ── Imágenes ───────────────────────────────────────────────────────────────
  const [images, setImages] = useState<ImagePreview[]>([]);

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
    reset: resetCategories,
  } = useCategorySelector();

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

  // Revocar URLs al desmontar
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  // ── Valores parseados ──────────────────────────────────────────────────────
  const parsedValues = useMemo(
    () => ({
      baseWeight: parseFloat(form.baseWeight),
      additionalValue: parseFloat(form.additionalValue),
      stock: parseInt(form.stock, 10),
    }),
    [form],
  );

  // ── Precio estimado en tiempo real ─────────────────────────────────────────
  const estimatedPrice = useMemo(() => {
    if (goldPricePerGram == null) return null;
    const { baseWeight, additionalValue } = parsedValues;
    if (Number.isNaN(baseWeight) || Number.isNaN(additionalValue)) return null;
    return baseWeight * goldPricePerGram + additionalValue;
  }, [parsedValues, goldPricePerGram]);

  // ── Detección de cambios ───────────────────────────────────────────────────
  // El valor adicional se compara contra su default ('0'), no contra '': de lo
  // contrario el formulario recién abierto se marcaría siempre como "con cambios"
  // y pediría confirmación al cerrar sin que el usuario haya tocado nada.
  const hasChanges = useMemo(() => {
    return (
      form.name.trim() !== '' ||
      form.description.trim() !== '' ||
      form.baseWeight !== '' ||
      form.additionalValue !== EMPTY_FORM.additionalValue ||
      form.stock !== '' ||
      resolvedCategoryId !== null ||
      images.length > 0 ||
      specEntries.some((e) => e.key.trim() !== '' || e.value.trim() !== '')
    );
  }, [form, resolvedCategoryId, images, specEntries]);

  // ── Reset del formulario ───────────────────────────────────────────────────

  /** Limpia completamente el formulario y revoca URLs de imágenes. */
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setSpecEntries([]);
    resetCategories();
  };

  // ── Manejo del cierre ──────────────────────────────────────────────────────

  /**
   * Intenta cerrar el modal. Si hay cambios, muestra el ConfirmModal de descarte.
   * Si no hay cambios, cierra directamente.
   */
  const handleRequestClose = () => {
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      resetForm();
      onClose();
    }
  };

  /** Ejecutado al confirmar el descarte en el ConfirmModal. */
  const handleConfirmDiscard = () => {
    setShowCancelConfirm(false);
    resetForm();
    onClose();
  };

  // ── Actualización de campos ────────────────────────────────────────────────

  const updateField = (field: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ProductFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Gestión de imágenes ────────────────────────────────────────────────────

  /**
   * Procesa los archivos recibidos del `ImageDropzone` (clic o drop): valida
   * tipo/tamaño/cupo con la utilidad compartida y genera previews.
   */
  const handleFilesSelected = (files: File[]) => {
    const availableSlots = MAX_IMAGES - images.length;
    const { accepted, error, overflow } = validateImageFiles(
      files,
      availableSlots,
    );

    if (error) {
      setErrors((prev) => ({ ...prev, images: error }));
      return;
    }

    const newPreviews: ImagePreview[] = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newPreviews]);
    setErrors((prev) => ({ ...prev, images: undefined }));

    if (overflow > 0) {
      showToast(
        'info',
        `Solo se agregaron ${accepted.length} imagen(es). Límite de ${MAX_IMAGES} alcanzado.`,
      );
    }
  };

  /** Elimina una imagen de la lista y revoca su URL de objeto. */
  const handleRemoveImage = (previewUrl: string) => {
    setImages((prev) => {
      const toRemove = prev.find((img) => img.previewUrl === previewUrl);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((img) => img.previewUrl !== previewUrl);
    });
    setErrors((prev) => ({ ...prev, images: undefined }));
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
   * Valida todos los campos, guarda los errores en estado y los devuelve.
   * Devolver el objeto permite al `handleSubmit` desplazarse al primer error
   * sin esperar a que el `setState` se aplique.
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

    if (images.length === 0) {
      next.images = 'Debes agregar al menos una imagen.';
    } else if (images.length > MAX_IMAGES) {
      next.images = `No puedes superar ${MAX_IMAGES} imágenes.`;
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

    const next = validateForm();
    if (Object.keys(next).length > 0) {
      // Lleva la vista (y el foco) al primer campo con problema.
      scrollToFirstError(next, ID_PREFIX);
      return;
    }
    if (resolvedCategoryId === null) return; // estrechamiento de tipo defensivo

    try {
      setSaving(true);
      await productService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        categoryId: resolvedCategoryId,
        baseWeight: parsedValues.baseWeight,
        additionalValue: parsedValues.additionalValue,
        stock: parsedValues.stock,
        specifications: buildSpecifications(specEntries),
        imageFiles: images.map((img) => img.file),
      });
      showToast('success', 'Joya creada correctamente.');
      resetForm();
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
          : 'No se pudo crear el producto. Intenta de nuevo.';
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const totalImages = images.length;

  /**
   * Nº de campos con error. Se cuentan solo los errores con MENSAJE definido,
   * no las claves del objeto: al resolver un error lo marcamos como `undefined`
   * (sin borrar la clave), por lo que `Object.keys(errors).length` seguiría
   * contándolo. Filtrar por valor logra que:
   * - El resumen no aparezca antes de pulsar "Crear" (p. ej. al subir una
   *   imagen, que limpia `errors.images` a `undefined`).
   * - El conteo disminuya a medida que se completan los campos.
   */
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <>
      {/* ── Modal principal ──────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--bg-overlay)] p-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-form-title"
      >
        <div className="w-full max-w-4xl rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-[var(--shadow-xl)]">
          {/* Encabezado */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2
                id="create-form-title"
                className="text-2xl font-semibold text-[var(--text-primary)]"
              >
                Nueva joya
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Completa los datos para agregar una nueva pieza al catálogo.
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
            <section aria-labelledby="section-basic">
              <h3
                id="section-basic"
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
                      placeholder="Ej: Anillo en oro blanco de 18k con zafiro central certificado."
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
                    label="Stock inicial"
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
              aria-labelledby="section-price"
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4"
            >
              <h3
                id="section-price"
                className="mb-3 text-base font-semibold text-[var(--text-primary)]"
              >
                Precio estimado
              </h3>

              {isLoadingGold ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Cargando precio del oro...
                </p>
              ) : goldPricePerGram == null ? (
                <p className="text-sm text-red-500">
                  No se pudo obtener el precio del oro. El cálculo no está
                  disponible.
                </p>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-8">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Precio del oro por gramo
                    </p>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      ${goldPricePerGram.toLocaleString('es-CO')} COP/g
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Estimado (peso × oro + adicional)
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-accent)]">
                      {estimatedPrice !== null
                        ? `$${Math.round(estimatedPrice).toLocaleString('es-CO')} COP`
                        : '—'}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ── Sección 3: Categoría ─────────────────────────────── */}
            <section aria-labelledby="section-category">
              <h3
                id="section-category"
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
                      <div className="flex h-12.5 items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4">
                        <p className="text-sm text-[var(--text-muted)]">
                          Primero selecciona una categoría principal
                        </p>
                      </div>
                    ) : subCategories.length === 0 ? (
                      <div className="flex h-12.5 items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4">
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
            <section aria-labelledby="section-images">
              <div className="mb-4">
                <h3
                  id="section-images"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  Imágenes
                  <span className="ml-1 text-red-500" aria-hidden="true">
                    *
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Entre 1 y {MAX_IMAGES} imágenes. JPG, PNG o WEBP. Máx.{' '}
                  {MAX_IMAGE_SIZE_MB} MB por imagen.
                </p>
              </div>

              {/* Zona de carga (clic o drag & drop) */}
              {totalImages < MAX_IMAGES && (
                <div className="mb-4">
                  <ImageDropzone
                    id={`${ID_PREFIX}-images`}
                    remaining={MAX_IMAGES - totalImages}
                    onFiles={handleFilesSelected}
                  />
                </div>
              )}

              {/* Contador */}
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">
                  Imágenes seleccionadas
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

              {/* Grid de previews */}
              {totalImages > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {images.map((img) => (
                    <div
                      key={img.previewUrl}
                      className="overflow-hidden rounded-2xl border border-[var(--border-color)] transition hover:border-[var(--border-strong)]"
                    >
                      <img
                        src={img.previewUrl}
                        alt={`Preview de ${img.file.name}`}
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
                          onClick={() => handleRemoveImage(img.previewUrl)}
                          className="mt-1 w-full rounded-lg bg-red-500 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-red-600 active:scale-95 cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
              submitLabel="Crear joya"
              savingLabel="Creando joya..."
              errorCount={errorCount}
              onCancel={handleRequestClose}
            />
          </form>
        </div>
      </div>

      {/* ── ConfirmModal de descarte ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        variant="danger"
        title="¿Descartar cambios?"
        message="Los datos ingresados se perderán y no podrás recuperarlos."
        confirmLabel="Sí, descartar"
        cancelLabel="Seguir editando"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </>
  );
};
