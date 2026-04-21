/**
 * @file product-edit-form.tsx
 * @description Modal de edición de una joya existente para el panel de
 * administración de Joyería KOB.
 *
 * ## Funcionalidades (paridad con product-create-form)
 * - Carga los valores actuales del producto al abrir.
 * - Selector de categoría en dos pasos pre-inicializado con la categoría actual.
 * - Editor de especificaciones dinámico pre-cargado con las specs actuales.
 * - Precio recalculado en tiempo real usando el precio real del oro del store.
 * - Campo "valor adicional" con formato visual de miles.
 * - Gestión de imágenes: conservar, quitar (marcar para eliminar) y restaurar
 *   las existentes; agregar nuevas con preview y deselección individual.
 * - Validaciones inline por campo (sin `window.alert`).
 * - `ConfirmModal` para descartar cambios sin guardar.
 * - Toast de éxito o error al completar la operación.
 * - Hover y `active:scale-95` en todos los botones interactivos.
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
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import { useCategorySelector } from '../hooks/use-category-selector';
import { useGoldPriceStore } from '@/store/gold-price.store';
import { useToastStore } from '@/store/toast.store';
import { productService } from '../services/product.service';
import type { Product, ProductSpecifications } from '../types/product.types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_IMAGES = 5;
const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 800;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// ─── Clases reutilizables ─────────────────────────────────────────────────────

const INPUT_BASE =
  'w-full rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:border-[var(--border-strong)]';

const BTN_PRIMARY =
  'rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-text)] shadow-[var(--shadow-accent)] transition hover:opacity-90 active:scale-95 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

const BTN_SECONDARY =
  'rounded-xl border border-[var(--border-color)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface EditFormState {
  name: string;
  description: string;
  baseWeight: string;
  /** Solo dígitos. El formato visual se aplica en render. */
  additionalValue: string;
  stock: string;
}

interface SpecEntry {
  id: string;
  key: string;
  value: string;
}

interface NewImagePreview {
  file: File;
  previewUrl: string;
}

type FormErrors = Partial<
  Record<
    | 'name'
    | 'description'
    | 'baseWeight'
    | 'additionalValue'
    | 'stock'
    | 'categoryId'
    | 'images'
    | 'specs',
    string
  >
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM: EditFormState = {
  name: '',
  description: '',
  baseWeight: '',
  additionalValue: '',
  stock: '',
};

const generateId = () => Math.random().toString(36).substring(2, 9);

/** Formatea dígitos con separadores de miles (locale colombiano). */
const formatThousands = (raw: string): string => {
  const num = parseFloat(raw.replace(/[^0-9]/g, ''));
  if (Number.isNaN(num)) return '';
  return num.toLocaleString('es-CO');
};

/** Extrae solo los dígitos de un string formateado. */
const stripFormatting = (formatted: string): string =>
  formatted.replace(/[^0-9]/g, '');

/**
 * Convierte el objeto `ProductSpecifications` en filas del editor dinámico.
 * Los booleanos se convierten a "true"/"false".
 * Los arrays se convierten a string separado por coma.
 *
 * @param specs - Especificaciones del producto.
 * @returns Array de filas para el editor de especificaciones.
 */
const specsToEntries = (specs: ProductSpecifications): SpecEntry[] =>
  Object.entries(specs).map(([key, value]) => ({
    id: generateId(),
    key,
    value: Array.isArray(value)
      ? value.join(', ')
      : typeof value === 'boolean'
        ? String(value)
        : String(value ?? ''),
  }));

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

// ─── Subcomponente Field ──────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

const Field = ({
  label,
  error,
  required = false,
  hint,
  children,
}: FieldProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-[var(--text-primary)]">
      {label}
      {required && (
        <span className="ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
    {children}
    {hint && !error && (
      <p className="text-xs text-[var(--text-muted)]">{hint}</p>
    )}
    {error && (
      <p className="text-xs text-red-500" role="alert">
        {error}
      </p>
    )}
  </div>
);

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [isAdditionalValueFocused, setIsAdditionalValueFocused] =
    useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ── Estado de imágenes ─────────────────────────────────────────────────────
  /** Nombres de imágenes existentes que se conservarán. */
  const [existingImages, setExistingImages] = useState<string[]>([]);
  /** Nombres de imágenes marcadas para eliminar en el backend. */
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  /** Archivos nuevos a agregar. */
  const [newImages, setNewImages] = useState<NewImagePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Especificaciones ───────────────────────────────────────────────────────
  const [specEntries, setSpecEntries] = useState<SpecEntry[]>([]);

  // ── Stores ─────────────────────────────────────────────────────────────────
  const {
    goldPricePerGram,
    isLoading: isLoadingGold,
    loadGoldPrice,
  } = useGoldPriceStore();
  const { showToast } = useToastStore();
  const serverUrl = import.meta.env.VITE_API_URL.replace('/api', '');

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
  }, [isOpen, product]); // initializeWith es estable, no necesita estar en deps

  // Cargar precio del oro al abrir
  useEffect(() => {
    if (isOpen) void loadGoldPrice();
  }, [isOpen, loadGoldPrice]);

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
    if (goldPricePerGram === null) return null;
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
      JSON.stringify(buildSpecifications()) !==
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
  ]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (errors[field as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Valor adicional con formato ────────────────────────────────────────────

  const handleAdditionalValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateField('additionalValue', stripFormatting(e.target.value));
  };

  const additionalValueDisplay = isAdditionalValueFocused
    ? form.additionalValue
    : formatThousands(form.additionalValue);

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

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const availableSlots = MAX_IMAGES - totalImages;

    if (availableSlots <= 0) {
      setErrors((prev) => ({
        ...prev,
        images: `Ya tienes el máximo de ${MAX_IMAGES} imágenes permitidas.`,
      }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const invalidType = files.find(
      (f) => !ACCEPTED_IMAGE_TYPES.includes(f.type),
    );
    if (invalidType) {
      setErrors((prev) => ({
        ...prev,
        images: 'Solo se permiten imágenes JPG, PNG o WEBP.',
      }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const oversized = files.find((f) => f.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized) {
      setErrors((prev) => ({
        ...prev,
        images: `Cada imagen debe pesar menos de ${MAX_IMAGE_SIZE_MB} MB.`,
      }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToAdd = files.slice(0, availableSlots);
    const previews: NewImagePreview[] = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...previews]);
    setErrors((prev) => ({ ...prev, images: undefined }));

    if (files.length > availableSlots) {
      showToast(
        'info',
        `Solo se agregaron ${availableSlots} imagen(es). Límite alcanzado.`,
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Elimina una imagen nueva de la lista y revoca su URL de objeto.
   */
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

  /** Construye el objeto de specs a partir de las filas del editor. */
  function buildSpecifications(): ProductSpecifications {
    const specs: ProductSpecifications = {};
    specEntries.forEach(({ key, value }) => {
      const k = key.trim();
      const v = value.trim();
      if (!k || !v) return;
      if (v.toLowerCase() === 'true') specs[k] = true;
      else if (v.toLowerCase() === 'false') specs[k] = false;
      else if (v.includes(','))
        specs[k] = v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      else specs[k] = v;
    });
    return specs;
  }

  // ── Validación ─────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const next: FormErrors = {};

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
      next.specs = 'Hay claves de especificación duplicadas.';
    } else if (specEntries.some((e) => e.key.trim() && !e.value.trim())) {
      next.specs = 'Todas las claves deben tener un valor.';
    } else if (specEntries.some((e) => !e.key.trim() && e.value.trim())) {
      next.specs = 'Todos los valores deben tener una clave.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product || !validateForm()) return;
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
        specifications: buildSpecifications(),
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
              className={BTN_SECONDARY}
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
                  <Field label="Nombre" required error={errors.name}>
                    <input
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
                    error={errors.description}
                  >
                    <textarea
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
                  error={errors.baseWeight}
                  hint="Admite decimales. Ej: 4.5"
                >
                  <input
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

                {/* Valor adicional con formato de miles */}
                <Field
                  label="Valor adicional (COP)"
                  required
                  error={errors.additionalValue}
                  hint="Ingresa el monto. Se formatea automáticamente."
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={additionalValueDisplay}
                    onFocus={() => setIsAdditionalValueFocused(true)}
                    onBlur={() => setIsAdditionalValueFocused(false)}
                    onChange={handleAdditionalValueChange}
                    placeholder="1.200.000"
                    className={INPUT_BASE}
                  />
                </Field>

                {/* Stock */}
                <div className="md:col-span-2">
                  <Field
                    label="Stock"
                    required
                    error={errors.stock}
                    hint="Número entero de unidades disponibles."
                  >
                    <input
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
                ) : goldPricePerGram === null ? (
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
                      <p className="text-2xl font-bold text-[var(--accent)]">
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
                    <label className="text-sm font-medium text-[var(--text-primary)]">
                      Categoría principal
                    </label>
                    <select
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
                      className={`${INPUT_BASE} bg-[var(--bg-secondary)] cursor-pointer`}
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
                        className={`${INPUT_BASE} bg-[var(--bg-secondary)] cursor-pointer`}
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
            <section aria-labelledby="edit-section-specs">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="edit-section-specs"
                    className="text-base font-semibold text-[var(--text-primary)]"
                  >
                    Especificaciones técnicas{' '}
                    <span className="font-normal text-[var(--text-muted)]">
                      (opcional)
                    </span>
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Pares clave-valor. "true"/"false" para booleanos. Separados
                    por coma para listas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSpecEntry}
                  className="shrink-0 rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)] active:scale-95 cursor-pointer"
                >
                  + Agregar
                </button>
              </div>

              {specEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border-color)] px-4 py-6 text-center">
                  <p className="text-sm text-[var(--text-muted)]">
                    Sin especificaciones. Haz clic en "+ Agregar" para añadir.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {specEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[1fr_1fr_auto] items-center gap-3"
                    >
                      <input
                        type="text"
                        value={entry.key}
                        onChange={(e) =>
                          updateSpecEntry(entry.id, 'key', e.target.value)
                        }
                        placeholder="Clave (ej: requiresSize)"
                        className="rounded-xl border border-[var(--border-color)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:border-[var(--border-strong)]"
                      />
                      <input
                        type="text"
                        value={entry.value}
                        onChange={(e) =>
                          updateSpecEntry(entry.id, 'value', e.target.value)
                        }
                        placeholder="Valor (ej: true, 6,7,8)"
                        className="rounded-xl border border-[var(--border-color)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:border-[var(--border-strong)]"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecEntry(entry.id)}
                        aria-label="Eliminar especificación"
                        className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10 hover:border-red-500/30 active:scale-95"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.specs && (
                <p className="mt-2 text-xs text-red-500" role="alert">
                  {errors.specs}
                </p>
              )}
            </section>

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
                        : 'bg-[var(--accent)]/10 text-[var(--accent)]'
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
                          src={`${serverUrl}/uploads/products/${imageName}`}
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
                          src={`${serverUrl}/uploads/products/${imageName}`}
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

              {/* Zona de carga */}
              {totalImages < MAX_IMAGES && (
                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] px-6 py-8 text-center transition hover:border-[var(--accent)] hover:bg-[var(--bg-tertiary)]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleNewImagesChange}
                    className="hidden"
                  />
                  <div className="mb-2 text-2xl opacity-60 transition group-hover:scale-110 group-hover:opacity-80">
                    📤
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Agregar imágenes
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Puedes agregar {MAX_IMAGES - totalImages} imagen(es) más
                  </p>
                </label>
              )}

              {errors.images && (
                <p className="mt-2 text-xs text-red-500" role="alert">
                  {errors.images}
                </p>
              )}
            </section>

            {/* ── Acciones ─────────────────────────────────────────── */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleRequestClose}
                className={BTN_SECONDARY}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className={BTN_PRIMARY}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
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
