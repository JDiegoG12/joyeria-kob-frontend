/**
 * @file subcategory-form.tsx
 * @description Formulario colapsable para añadir una subcategoría directa dentro del Drawer.
 *
 * Comportamiento
 * - Se muestra colapsado por defecto para mantener la UI limpia.
 * - Al expandir, enfoca automáticamente el campo de nombre.
 * - Al guardar o cancelar, se colapsa y limpia el estado interno.
 *
 * Slug
 * Se genera internamente desde el nombre. No se expone al usuario para evitar confusión.
 *
 * Uso:
 * ```tsx
 * <SubcategoryForm parentId={parentId} onSuccess={handleReload} />
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Convierte texto libre en slug URL-friendly.
 *
 * @param text - Texto a convertir.
 * @returns Slug normalizado.
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

interface SubcategoryFormProps {
  /** ID de la categoría padre a la que pertenecerá la nueva subcategoría. */
  parentId: number;
  /** Se dispara tras crear la subcategoría exitosamente para refrescar la UI. */
  onSuccess: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Formulario inline colapsable para crear subcategorías.
 * Gestiona su propio estado de apertura, validación y enfoque automático.
 * Incluye guardas de nulidad en todos los eventos de estilo para evitar
 * errores de renderizado asíncrono en React 19.
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
  const slug = toSlug(name);

  // Foco automático al expandir
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault(); //  Bloquea recarga nativa
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('El nombre es obligatorio.');
      return; // Sale sin llamar al store
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
      // Toast y mutationError ya se gestionan en el store
    }
  };

  // Helpers seguros para manipulación inline de estilos
  const setHoverStyle = (e: React.MouseEvent<HTMLElement>, bgColor: string) => {
    if (!e.currentTarget) return;
    e.currentTarget.style.backgroundColor = bgColor;
  };

  const setFocusStyle = (
    e: React.FocusEvent<HTMLElement>,
    borderColor: string,
    boxShadow: string,
  ) => {
    if (!e.currentTarget) return;
    e.currentTarget.style.borderColor = borderColor;
    e.currentTarget.style.boxShadow = boxShadow;
  };

  const resetFocusStyle = (e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget) return;
    e.currentTarget.style.borderColor = 'var(--border-color)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-color)' }}
    >
      {/* Botón toggle */}
      <motion.button
        onClick={isOpen ? handleCancel : handleOpen}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors"
        style={{
          backgroundColor: isOpen ? 'var(--accent-subtle)' : 'transparent',
        }}
        onHoverStart={(e) => {
          if (!isOpen)
            setHoverStyle(
              e as unknown as React.MouseEvent<HTMLElement>,
              'var(--bg-hover)',
            );
        }}
        onHoverEnd={(e) => {
          if (!isOpen)
            setHoverStyle(
              e as unknown as React.MouseEvent<HTMLElement>,
              'transparent',
            );
        }}
      >
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
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </motion.button>

      {/* Formulario colapsable */}
      <AnimatePresence initial={false}>
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
              className="flex flex-col gap-4 p-4 sm:p-5"
              style={{ borderTop: '1px solid var(--border-color)' }}
            >
              {/* Campo: Nombre */}
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
                  Nombre <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  ref={inputRef}
                  id="sub-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Ej: Compromiso"
                  className="w-full rounded-lg px-3 py-2.5 outline-none transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                  }}
                  onFocus={(e) =>
                    setFocusStyle(
                      e,
                      'var(--accent)',
                      '0 0 0 3px var(--accent-subtle)',
                    )
                  }
                  onBlur={resetFocusStyle}
                />
              </div>

              {/* Campo: Descripción */}
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
                  id="sub-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción breve..."
                  rows={2}
                  className="w-full resize-none rounded-lg px-3 py-2.5 outline-none transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    lineHeight: 'var(--leading-relaxed)',
                  }}
                  onFocus={(e) =>
                    setFocusStyle(
                      e,
                      'var(--accent)',
                      '0 0 0 3px var(--accent-subtle)',
                    )
                  }
                  onBlur={resetFocusStyle}
                />
              </div>

              {/* Error de validación local */}
              {validationError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-error)',
                  }}
                >
                  {validationError}
                </motion.p>
              )}

              {/* Error del backend */}
              {mutationError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
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
                </motion.div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <motion.button
                  onClick={handleCancel}
                  disabled={isSaving}
                  whileHover={{ scale: isSaving ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving ? 1 : 0.98 }}
                  className="flex-1 cursor-pointer rounded-lg py-2 transition-colors disabled:opacity-40"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                  }}
                  onHoverStart={(e) => {
                    if (!isSaving)
                      setHoverStyle(
                        e as unknown as React.MouseEvent<HTMLElement>,
                        'var(--bg-hover)',
                      );
                  }}
                  onHoverEnd={(e) => {
                    setHoverStyle(
                      e as unknown as React.MouseEvent<HTMLElement>,
                      'transparent',
                    );
                  }}
                >
                  Cancelar
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSaving}
                  whileHover={{ scale: isSaving ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving ? 1 : 0.98 }}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 transition-colors disabled:opacity-40"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                  }}
                  onHoverStart={(e) => {
                    if (!isSaving) {
                      const el = e as unknown as React.MouseEvent<HTMLElement>;
                      setHoverStyle(el, 'var(--accent-hover)');
                      if (el.currentTarget)
                        el.currentTarget.style.boxShadow =
                          'var(--shadow-accent)';
                    }
                  }}
                  onHoverEnd={(e) => {
                    const el = e as unknown as React.MouseEvent<HTMLElement>;
                    setHoverStyle(el, 'var(--accent)');
                    if (el.currentTarget)
                      el.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
