import { useEffect, useMemo, useState } from 'react';
import { productService } from '../services/product.service';
import type { Product } from '../types/product.types';

interface ProductEditFormProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductFormState {
  name: string;
  description: string;
  baseWeight: string;
  additionalValue: string;
  laborCost: string;
  stock: string;
}

interface NewImagePreview {
  file: File;
  previewUrl: string;
}

const MAX_IMAGES = 4;

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  baseWeight: '',
  additionalValue: '',
  laborCost: '',
  stock: '',
};

export const ProductEditForm = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}: ProductEditFormProps) => {
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newImages, setNewImages] = useState<NewImagePreview[]>([]);

  const serverUrl = import.meta.env.VITE_API_URL.replace('/api', '');

  useEffect(() => {
    if (!product || !isOpen) {
      setForm(emptyForm);
      setNewImages([]);
      return;
    }

    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      baseWeight: String(product.baseWeight ?? ''),
      additionalValue: String(product.additionalValue ?? ''),
      laborCost: String(product.laborCost ?? ''),
      stock: String(product.stock ?? ''),
    });

    setNewImages([]);
  }, [product, isOpen]);

  useEffect(() => {
    return () => {
      newImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, [newImages]);

  const parsedValues = useMemo(() => {
    return {
      baseWeight: Number(form.baseWeight),
      additionalValue: Number(form.additionalValue),
      laborCost: Number(form.laborCost),
      stock: Number(form.stock),
    };
  }, [form]);

  const hasChanges = useMemo(() => {
    if (!product) return false;

    return (
      form.name.trim() !== product.name ||
      form.description.trim() !== product.description ||
      parsedValues.baseWeight !== product.baseWeight ||
      parsedValues.additionalValue !== product.additionalValue ||
      parsedValues.laborCost !== product.laborCost ||
      parsedValues.stock !== product.stock ||
      newImages.length > 0
    );
  }, [form, parsedValues, product, newImages]);

  const suggestedPrice = useMemo(() => {
    if (!product) return 0;

    const { baseWeight, additionalValue, laborCost } = parsedValues;

    if (
      Number.isNaN(baseWeight) ||
      Number.isNaN(additionalValue) ||
      Number.isNaN(laborCost)
    ) {
      return product.calculatedPrice;
    }

    const currentBase =
      Number(product.baseWeight) +
      Number(product.additionalValue) +
      Number(product.laborCost);

    if (currentBase <= 0) {
      return baseWeight + additionalValue + laborCost;
    }

    const ratio = Number(product.calculatedPrice) / currentBase;

    return (baseWeight + additionalValue + laborCost) * ratio;
  }, [parsedValues, product]);

  if (!isOpen || !product) return null;

  const updateField = (field: keyof ProductFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      window.alert('El nombre es obligatorio.');
      return false;
    }

    if (!form.description.trim()) {
      window.alert('La descripción es obligatoria.');
      return false;
    }

    if (form.baseWeight === '' || Number.isNaN(parsedValues.baseWeight)) {
      window.alert('El peso base debe ser un número válido.');
      return false;
    }

    if (parsedValues.baseWeight < 0) {
      window.alert('El peso base no puede ser negativo.');
      return false;
    }

    if (
      form.additionalValue === '' ||
      Number.isNaN(parsedValues.additionalValue)
    ) {
      window.alert('El valor adicional debe ser un número válido.');
      return false;
    }

    if (parsedValues.additionalValue < 0) {
      window.alert('El valor adicional no puede ser negativo.');
      return false;
    }

    if (form.laborCost === '' || Number.isNaN(parsedValues.laborCost)) {
      window.alert('La mano de obra debe ser un número válido.');
      return false;
    }

    if (parsedValues.laborCost < 0) {
      window.alert('La mano de obra no puede ser negativa.');
      return false;
    }

    if (form.stock === '' || Number.isNaN(parsedValues.stock)) {
      window.alert('El stock debe ser un número válido.');
      return false;
    }

    if (!Number.isInteger(parsedValues.stock) || parsedValues.stock < 0) {
      window.alert('El stock debe ser un entero mayor o igual a 0.');
      return false;
    }

    if (newImages.length > MAX_IMAGES) {
      window.alert(`No puedes subir más de ${MAX_IMAGES} imágenes.`);
      return false;
    }

    return true;
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'Tienes cambios sin guardar. ¿Seguro que deseas cerrar?',
      );

      if (!confirmed) return;
    }

    newImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });

    onClose();
  };

  const handleNewImagesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) return;

    const availableSlots = MAX_IMAGES - newImages.length;

    if (availableSlots <= 0) {
      window.alert(`Ya tienes el máximo de ${MAX_IMAGES} imágenes nuevas.`);
      event.target.value = '';
      return;
    }

    const filesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      window.alert(`Solo puedes agregar ${availableSlots} imagen(es) más.`);
    }

    const previews = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...previews]);
    event.target.value = '';
  };

  const handleRemoveNewImage = (previewUrl: string) => {
    setNewImages((prev) => {
      const imageToRemove = prev.find((image) => image.previewUrl === previewUrl);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return prev.filter((image) => image.previewUrl !== previewUrl);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!hasChanges) return;

    try {
      setSaving(true);

      await productService.update(product.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        baseWeight: parsedValues.baseWeight,
        additionalValue: parsedValues.additionalValue,
        laborCost: parsedValues.laborCost,
        stock: parsedValues.stock,
        imageFiles: newImages.map((image) => image.file),
      });

      window.alert('Producto actualizado correctamente.');

      newImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });

      onSuccess();
    } catch (error: any) {
      console.error('ERROR UPDATE PRODUCT:', error?.response?.data || error);
      window.alert(
        error?.response?.data?.message || 'No se pudo actualizar el producto.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Editar joya</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Actualiza los datos principales e imágenes del producto.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 transition hover:bg-[var(--bg-tertiary)]"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Peso base
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.baseWeight}
                onChange={(e) => updateField('baseWeight', e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Valor adicional
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.additionalValue}
                onChange={(e) => updateField('additionalValue', e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Mano de obra
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.laborCost}
                onChange={(e) => updateField('laborCost', e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Stock</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-transparent px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Precio actual:
            </p>
            <p className="text-lg font-semibold text-[var(--accent)]">
              ${product.calculatedPrice.toLocaleString('es-CO')}
            </p>

            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Precio sugerido recalculado:
            </p>
            <p className="text-xl font-bold text-[var(--accent)]">
              ${Math.round(suggestedPrice).toLocaleString('es-CO')}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <div>
              <h3 className="text-lg font-semibold">Imágenes actuales</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Si subes nuevas imágenes, el backend reemplazará todas las imágenes actuales.
              </p>
            </div>

            {product.images.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Este producto no tiene imágenes actuales.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {product.images.map((imageName) => (
                  <div
                    key={imageName}
                    className="overflow-hidden rounded-2xl border border-[var(--border-color)]"
                  >
                    <img
                      src={`${serverUrl}/uploads/products/${imageName}`}
                      alt={product.name}
                      className="h-36 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            <div>
              <h3 className="text-lg font-semibold">Nuevas imágenes</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Puedes subir hasta {MAX_IMAGES} imágenes. Si agregas nuevas, reemplazarán todas las actuales al guardar.
              </p>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewImagesChange}
              className="block w-full text-sm"
            />

            {newImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {newImages.map((image) => (
                  <div
                    key={image.previewUrl}
                    className="overflow-hidden rounded-2xl border border-[var(--border-color)]"
                  >
                    <img
                      src={image.previewUrl}
                      alt="Nueva imagen"
                      className="h-36 w-full object-cover"
                    />

                    <div className="p-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(image.previewUrl)}
                        className="w-full rounded-xl bg-red-500 px-3 py-2 text-sm text-white transition hover:bg-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-[var(--text-secondary)]">
              Nuevas imágenes seleccionadas: {newImages.length}/{MAX_IMAGES}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-[var(--border-color)] px-5 py-3 transition hover:bg-[var(--bg-tertiary)]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};