/**
 * @file category-form.tsx
 * @description Formulario reutilizable para crear y editar categorías.
 *
 * ## Modos
 * - **create**: Campos vacíos. El slug se genera internamente desde el nombre.
 * - **edit**: Campos precargados. El slug se recalcula si el nombre cambia.
 *
 * ## Slug
 * Es un detalle técnico interno (URLs, SEO). No se expone al usuario.
 * Se genera y actualiza automáticamente desde el nombre en todo momento.
 *
 * ## Uso
 * ```tsx
 * <CategoryForm
 *   mode="create"
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   isSaving={isSaving}
 *   error={mutationError}
 * />
 * ```
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type {
  Category,
  CategoryCreateInput,
} from '@/features/categories/types/category.types';

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Convierte un texto libre en un slug URL-friendly.
 * Elimina tildes, convierte a minúsculas y reemplaza espacios con guiones.
 *
 * @param text - Texto de entrada (ej: "Anillos de Compromiso")
 * @returns Slug generado (ej: "anillos-de-compromiso")
 */
const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoryFormProps {
  /** Modo del formulario. */
  mode: 'create' | 'edit';
  /** Datos actuales de la categoría (requerido en modo edit). */
  initialData?: Category;
  /** Se dispara al enviar el formulario con los datos validados. */
  onSubmit: (data: CategoryCreateInput) => Promise<void>;
  /** Se dispara al cancelar. */
  onCancel: () => void;
  /** `true` mientras se guarda. Deshabilita el botón de submit. */
  isSaving: boolean;
  /** Error del backend para mostrar bajo el formulario. */
  error: string | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Formulario de creación y edición de categorías.
 * El slug se genera automáticamente desde el nombre — nunca se pide al usuario.
 */
export const CategoryForm = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSaving,
  error,
}: CategoryFormProps) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? '',
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Slug derivado siempre desde el nombre actual.
   * En modo edit se recalcula si el usuario cambia el nombre,
   * garantizando consistencia sin exponérselo explícitamente.
   */
  const slug = toSlug(name);

  // Limpia el error de validación cuando el usuario empieza a corregir
  useEffect(() => {
    if (validationError) setValidationError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const handleSubmit = async () => {
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('El nombre es obligatorio.');
      return;
    }

    const payload: CategoryCreateInput = {
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
      parentId: initialData?.parentId ?? undefined,
    };

    await onSubmit(payload);
  };

  const isEdit = mode === 'edit';

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col gap-5"
    >
      {/* Campo: Nombre */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="category-name"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
          }}
        >
          Nombre <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Anillos de Compromiso"
          autoFocus
          className="w-full rounded-xl px-4 py-3 transition-all outline-none"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              'var(--accent)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 0 0 3px var(--accent-subtle)';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              'var(--border-color)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        />

        {/* Vista previa del slug generado — informativa, no editable */}
        {name.trim() && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            /{slug}
          </motion.p>
        )}
      </div>

      {/* Campo: Descripción */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="category-description"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
          }}
        >
          Descripción{' '}
          <span
            style={{
              color: 'var(--text-muted)',
              fontWeight: 'var(--font-normal)',
            }}
          >
            (opcional)
          </span>
        </label>
        <textarea
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe brevemente esta categoría..."
          rows={3}
          className="w-full resize-none rounded-xl px-4 py-3 transition-all outline-none"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            lineHeight: 'var(--leading-relaxed)',
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              'var(--accent)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 0 0 3px var(--accent-subtle)';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              'var(--border-color)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Error de validación local */}
      {validationError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-error)',
          }}
        >
          {validationError}
        </motion.p>
      )}

      {/* Error del backend */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-error)',
            }}
          >
            {error}
          </p>
        </motion.div>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 rounded-xl py-3 transition-colors"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'transparent',
            opacity: isSaving ? 'var(--opacity-disabled)' : '1',
          }}
          onMouseEnter={(e) => {
            if (!isSaving)
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'transparent';
          }}
        >
          Cancelar
        </button>

        <button
          onClick={() => void handleSubmit()}
          disabled={isSaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 transition-opacity"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            opacity: isSaving ? 'var(--opacity-disabled)' : '1',
            cursor: isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving && <Loader2 size={15} className="animate-spin" />}
          {isSaving
            ? 'Guardando...'
            : isEdit
              ? 'Guardar cambios'
              : 'Crear categoría'}
        </button>
      </div>
    </motion.div>
  );
};
