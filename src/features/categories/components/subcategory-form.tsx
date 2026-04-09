/**
 * @file subcategory-form.tsx
 * @description Formulario inline para añadir una subcategoría dentro del Drawer.
 *
 * Se renderiza colapsado y se expande al pulsar "Añadir subcategoría".
 * Al guardar exitosamente, colapsa y limpia los campos.
 *
 * ## Slug
 * Se genera internamente desde el nombre. No se expone al usuario.
 *
 * ## Uso
 * ```tsx
 * <SubcategoryForm
 *   parentId={selectedCategory.id}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';

// ─── Utilidades ───────────────────────────────────────────────────────────────

const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

// ─── Props ────────────────────────────────────────────────────────────────────

interface SubcategoryFormProps {
  /** ID de la categoría padre a la que pertenecerá la nueva subcategoría. */
  parentId: number;
  /** Se dispara tras crear la subcategoría exitosamente. */
  onSuccess: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Formulario colapsable para añadir una subcategoría directa.
 * Se expande al pulsar el botón y se colapsa al guardar o cancelar.
 * El slug se genera internamente — no se pide al usuario.
 */
export const SubcategoryForm = ({
  parentId,
  onSuccess,
}: SubcategoryFormProps) => {
  const { createCategory, isSaving, mutationError, clearMutationError } =
    useCategoryStore();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Slug derivado siempre desde el nombre. Nunca se expone al usuario. */
  const slug = toSlug(name);

  // Foco al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Limpia error de validación al corregir el nombre
  useEffect(() => {
    if (validationError) setValidationError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const handleOpen = () => {
    clearMutationError();
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setName('');
    setDescription('');
    setValidationError(null);
  };

  const handleSubmit = async () => {
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('El nombre es obligatorio.');
      return;
    }

    try {
      await createCategory({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        parentId,
      });
      handleCancel();
      onSuccess();
    } catch {
      // El error ya está en mutationError del store
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-color)' }}
    >
      {/* Botón para expandir/colapsar */}
      <button
        onClick={isOpen ? handleCancel : handleOpen}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors"
        style={{
          backgroundColor: isOpen ? 'var(--accent-subtle)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isOpen)
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--bg-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen)
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'transparent';
        }}
      >
        <div className="flex items-center gap-2">
          <Plus
            size={15}
            style={{ color: isOpen ? 'var(--accent)' : 'var(--text-muted)' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: isOpen ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            Añadir subcategoría
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </button>

      {/* Formulario colapsable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="subcategory-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="flex flex-col gap-4 p-4"
              style={{ borderTop: '1px solid var(--border-color)' }}
            >
              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="sub-name"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-secondary)',
                    letterSpacing: 'var(--tracking-wide)',
                    textTransform: 'uppercase',
                  }}
                >
                  Nombre *
                </label>
                <input
                  ref={inputRef}
                  id="sub-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Compromiso"
                  className="w-full rounded-lg px-3 py-2.5 transition-all outline-none"
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
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--border-color)';
                  }}
                />

                {/* Vista previa del slug — informativa, no editable */}
                {name.trim() && (
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    /{slug}
                  </p>
                )}
              </div>

              {/* Descripción opcional */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="sub-description"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-secondary)',
                    letterSpacing: 'var(--tracking-wide)',
                    textTransform: 'uppercase',
                  }}
                >
                  Descripción (opcional)
                </label>
                <textarea
                  id="sub-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción breve..."
                  rows={2}
                  className="w-full resize-none rounded-lg px-3 py-2.5 transition-all outline-none"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--accent)';
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--border-color)';
                  }}
                />
              </div>

              {/* Error de validación */}
              {validationError && (
                <p
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-error)',
                  }}
                >
                  {validationError}
                </p>
              )}

              {/* Error del backend */}
              {mutationError && (
                <div
                  className="rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-error)',
                    }}
                  >
                    {mutationError}
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 rounded-lg py-2 transition-colors"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
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
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-opacity"
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
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
