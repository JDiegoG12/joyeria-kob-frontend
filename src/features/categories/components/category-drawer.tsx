/**
 * @file category-drawer.tsx
 * @description Panel lateral Master-Detail de categorías.
 *
 * ## Comportamiento por breakpoint
 * - **Desktop (lg+)**: Drawer lateral deslizante desde la derecha.
 * - **Mobile**: Bottom Sheet arrastrable con swipe to dismiss.
 *
 * ## Modos del drawer
 * - `view`   → Detalle: descripción, lista de subcategorías con acciones
 *              (editar/eliminar siempre visibles), botones Editar/Eliminar footer.
 * - `edit`   → Formulario precargado para editar la categoría padre.
 * - `create` → Formulario vacío para nueva categoría raíz.
 *
 * ## Botones de subcategoría
 * Editar y eliminar son siempre visibles (no dependen de hover) para
 * garantizar accesibilidad en dispositivos touch.
 *
 * ## Edición inline de subcategorías
 * Al pulsar editar, el `<li>` se transforma en un mini formulario
 * controlado por `editingSubId`. Soporta Enter para guardar y Escape
 * para cancelar.
 *
 * ## Swipe to dismiss (mobile)
 * Al soltar con velocidad o distancia suficiente hacia abajo, cierra
 * el Bottom Sheet.
 */

import { useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import {
  Edit2,
  Tag,
  Layers,
  Trash2,
  X,
  Calendar,
  Check,
  Loader2,
} from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import { CategoryForm } from '@/features/categories/components/category-form';
import { SubcategoryForm } from '@/features/categories/components/subcategory-form';
import { DeleteConfirmModal } from '@/features/categories/components/delete-confirm-modal';
import type {
  Category,
  CategoryCreateInput,
} from '@/features/categories/types/category.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

// ─── Tipo interno para el modal de eliminación ────────────────────────────────

type PendingDelete =
  | { type: 'category' }
  | { type: 'subcategory'; id: number; name: string };

// ─── Componente principal ─────────────────────────────────────────────────────

export const CategoryDrawer = () => {
  const {
    drawerMode,
    selectedCategory,
    isSaving,
    isDeleting,
    mutationError,
    closeDrawer,
    openEdit,
    createCategory,
    updateCategory,
    deleteCategory,
    clearMutationError,
  } = useCategoryStore();

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOpen = drawerMode !== 'closed';

  const handleCreate = async (data: CategoryCreateInput) => {
    await createCategory(data);
  };

  const handleEdit = async (data: CategoryCreateInput) => {
    if (!selectedCategory) return;
    await updateCategory(selectedCategory.id, data);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleteError(null);
    try {
      if (pendingDelete.type === 'category') {
        if (!selectedCategory) return;
        await deleteCategory(selectedCategory.id);
      } else {
        await deleteCategory(pendingDelete.id);
        await useCategoryStore.getState().loadCategories(true);
        if (selectedCategory) {
          const fresh = useCategoryStore
            .getState()
            .categories.find((c) => c.id === selectedCategory.id);
          if (fresh) useCategoryStore.getState().openView(fresh);
        }
      }
      setPendingDelete(null);
    } catch {
      const err = useCategoryStore.getState().mutationError;
      setDeleteError(err);
    }
  };

  const handleOpenDeleteCategory = () => {
    clearMutationError();
    setDeleteError(null);
    setPendingDelete({ type: 'category' });
  };

  const handleOpenDeleteSubcategory = (sub: Category) => {
    clearMutationError();
    setDeleteError(null);
    setPendingDelete({ type: 'subcategory', id: sub.id, name: sub.name });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) closeDrawer();
  };

  const drawerTitle =
    drawerMode === 'create'
      ? 'Nueva categoría'
      : drawerMode === 'edit'
        ? 'Editar categoría'
        : (selectedCategory?.name ?? '');

  const deleteTargetName =
    pendingDelete?.type === 'subcategory'
      ? pendingDelete.name
      : (selectedCategory?.name ?? '');

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'var(--bg-overlay)' }}
              onClick={closeDrawer}
              aria-hidden="true"
            />

            {/* Panel Desktop */}
            <motion.aside
              key="drawer-desktop"
              role="dialog"
              aria-modal="true"
              aria-label={drawerTitle}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-[60] hidden flex-col lg:flex"
              style={{
                width: '420px',
                backgroundColor: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <DrawerContent
                drawerMode={drawerMode}
                drawerTitle={drawerTitle}
                selectedCategory={selectedCategory}
                isSaving={isSaving}
                mutationError={mutationError}
                onClose={closeDrawer}
                onEdit={openEdit}
                onDeleteCategory={handleOpenDeleteCategory}
                onDeleteSubcategory={handleOpenDeleteSubcategory}
                onCreate={handleCreate}
                onEditSubmit={handleEdit}
                onSubcategorySuccess={() =>
                  useCategoryStore.getState().loadCategories(true)
                }
              />
            </motion.aside>

            {/* Panel Mobile: Bottom Sheet */}
            <motion.aside
              key="drawer-mobile"
              role="dialog"
              aria-modal="true"
              aria-label={drawerTitle}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={handleDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 bottom-0 left-0 z-[60] flex flex-col lg:hidden"
              style={{
                maxHeight: '90vh',
                backgroundColor: 'var(--bg-secondary)',
                borderTopLeftRadius: 'var(--radius-2xl)',
                borderTopRightRadius: 'var(--radius-2xl)',
                borderTop: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: 'var(--border-strong)' }}
                />
              </div>

              <DrawerContent
                drawerMode={drawerMode}
                drawerTitle={drawerTitle}
                selectedCategory={selectedCategory}
                isSaving={isSaving}
                mutationError={mutationError}
                onClose={closeDrawer}
                onEdit={openEdit}
                onDeleteCategory={handleOpenDeleteCategory}
                onDeleteSubcategory={handleOpenDeleteSubcategory}
                onCreate={handleCreate}
                onEditSubmit={handleEdit}
                onSubcategorySuccess={() =>
                  useCategoryStore.getState().loadCategories(true)
                }
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {pendingDelete && (
        <DeleteConfirmModal
          categoryName={deleteTargetName}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => {
            setPendingDelete(null);
            setDeleteError(null);
          }}
        />
      )}
    </>
  );
};

// ─── Subcomponente: contenido del drawer ─────────────────────────────────────

interface DrawerContentProps {
  drawerMode: string;
  drawerTitle: string;
  selectedCategory: Category | null;
  isSaving: boolean;
  mutationError: string | null;
  onClose: () => void;
  onEdit: () => void;
  onDeleteCategory: () => void;
  onDeleteSubcategory: (sub: Category) => void;
  onCreate: (data: CategoryCreateInput) => Promise<void>;
  onEditSubmit: (data: CategoryCreateInput) => Promise<void>;
  onSubcategorySuccess: () => void;
}

const DrawerContent = ({
  drawerMode,
  drawerTitle,
  selectedCategory,
  isSaving,
  mutationError,
  onClose,
  onEdit,
  onDeleteCategory,
  onDeleteSubcategory,
  onCreate,
  onEditSubmit,
  onSubcategorySuccess,
}: DrawerContentProps) => {
  const [editingSubId, setEditingSubId] = useState<number | null>(null);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Cabecera */}
      <div
        className="flex flex-shrink-0 items-center justify-between px-6 py-5"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--accent-subtle)' }}
          >
            <Tag size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <h2
            className="truncate"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              maxWidth: '280px',
            }}
          >
            {drawerTitle}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Cerrar panel"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'transparent';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Cuerpo scrolleable */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait">
          {/* Formulario create / edit de la categoría padre */}
          {(drawerMode === 'create' || drawerMode === 'edit') && (
            <motion.div
              key={`form-${drawerMode}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <CategoryForm
                mode={drawerMode === 'create' ? 'create' : 'edit'}
                initialData={
                  drawerMode === 'edit'
                    ? (selectedCategory ?? undefined)
                    : undefined
                }
                onSubmit={drawerMode === 'create' ? onCreate : onEditSubmit}
                onCancel={onClose}
                isSaving={isSaving}
                error={mutationError}
              />
            </motion.div>
          )}

          {/* Vista de detalle */}
          {drawerMode === 'view' && selectedCategory && (
            <motion.div
              key="view"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              {/* Metadatos */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Creada el {formatDate(selectedCategory.createdAt)}
                  </span>
                </div>

                {selectedCategory.parent && (
                  <div className="flex items-center gap-2">
                    <Layers size={13} style={{ color: 'var(--text-muted)' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Subcategoría de{' '}
                      <span
                        style={{
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--accent)',
                        }}
                      >
                        {selectedCategory.parent.name}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <section>
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-muted)',
                    letterSpacing: 'var(--tracking-wide)',
                    textTransform: 'uppercase',
                  }}
                >
                  Descripción
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: selectedCategory.description
                      ? 'var(--text-secondary)'
                      : 'var(--text-muted)',
                    lineHeight: 'var(--leading-relaxed)',
                    fontStyle: selectedCategory.description
                      ? 'normal'
                      : 'italic',
                  }}
                >
                  {selectedCategory.description ??
                    'Sin descripción registrada.'}
                </p>
              </section>

              {/* Subcategorías */}
              <section>
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-muted)',
                    letterSpacing: 'var(--tracking-wide)',
                    textTransform: 'uppercase',
                  }}
                >
                  Subcategorías ({selectedCategory.children.length})
                </h3>

                {selectedCategory.children.length === 0 ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    Esta categoría no tiene subcategorías.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {selectedCategory.children.map((child: Category) =>
                      editingSubId === child.id ? (
                        <SubcategoryEditRow
                          key={child.id}
                          child={child}
                          onCancel={() => setEditingSubId(null)}
                          onSaved={() => {
                            setEditingSubId(null);
                            onSubcategorySuccess();
                          }}
                        />
                      ) : (
                        <li
                          key={child.id}
                          className="flex items-center justify-between rounded-xl px-4 py-3"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {/* Nombre */}
                          <span
                            className="min-w-0 truncate"
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: 'var(--text-sm)',
                              fontWeight: 'var(--font-medium)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {child.name}
                          </span>

                          {/*
                           * Botones SIEMPRE visibles — sin opacity-0/group-hover.
                           * Los dispositivos touch no tienen hover, por lo que
                           * ocultar las acciones solo en hover las hace inaccesibles
                           * en mobile. Se muestran siempre con tamaño compacto.
                           */}
                          <div className="ml-3 flex flex-shrink-0 items-center gap-0.5">
                            {/* Editar */}
                            <button
                              onClick={() => setEditingSubId(child.id)}
                              className="rounded-lg p-2 transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              aria-label={`Editar ${child.name}`}
                              title={`Editar ${child.name}`}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor = 'var(--bg-hover)';
                                (e.currentTarget as HTMLElement).style.color =
                                  'var(--accent)';
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor = 'transparent';
                                (e.currentTarget as HTMLElement).style.color =
                                  'var(--text-muted)';
                              }}
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => onDeleteSubcategory(child)}
                              className="rounded-lg p-2 transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              aria-label={`Eliminar ${child.name}`}
                              title={`Eliminar ${child.name}`}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor =
                                  'rgba(239, 68, 68, 0.1)';
                                (e.currentTarget as HTMLElement).style.color =
                                  'var(--color-error)';
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor = 'transparent';
                                (e.currentTarget as HTMLElement).style.color =
                                  'var(--text-muted)';
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </section>

              {/* Formulario inline añadir subcategoría */}
              <section>
                <SubcategoryForm
                  parentId={selectedCategory.id}
                  onSuccess={onSubcategorySuccess}
                />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer — solo en modo view */}
      {drawerMode === 'view' && selectedCategory && (
        <div
          className="flex flex-shrink-0 gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition-colors"
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
              (e.currentTarget as HTMLElement).style.borderColor =
                'var(--accent)';
              (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'transparent';
              (e.currentTarget as HTMLElement).style.borderColor =
                'var(--border-color)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--text-secondary)';
            }}
          >
            <Edit2 size={15} />
            Editar
          </button>

          <button
            onClick={onDeleteCategory}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-colors"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--color-error)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'rgba(239, 68, 68, 0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'rgba(239, 68, 68, 0.05)';
            }}
          >
            <Trash2 size={15} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Subcomponente: fila de edición inline de subcategoría ───────────────────

interface SubcategoryEditRowProps {
  child: Category;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Reemplaza el `<li>` de una subcategoría con un formulario inline.
 * @internal Solo se usa dentro de `DrawerContent`.
 */
const SubcategoryEditRow = ({
  child,
  onCancel,
  onSaved,
}: SubcategoryEditRowProps) => {
  const { updateCategory, isSaving } = useCategoryStore();
  const [name, setName] = useState(child.name);
  const [description, setDescription] = useState(child.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setError(null);
    try {
      await updateCategory(child.id, {
        name: name.trim(),
        slug: toSlug(name.trim()),
        description: description.trim() || undefined,
      });
      onSaved();
    } catch {
      const err = useCategoryStore.getState().mutationError;
      setError(err ?? 'Error al guardar.');
    }
  };

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-2 rounded-xl p-3"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--accent)',
        boxShadow: '0 0 0 3px var(--accent-subtle)',
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        className="w-full rounded-lg px-3 py-2 outline-none transition-all"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          color: 'var(--text-primary)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleSave();
          if (e.key === 'Escape') onCancel();
        }}
      />

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
        className="w-full rounded-lg px-3 py-2 outline-none transition-all"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleSave();
          if (e.key === 'Escape') onCancel();
        }}
      />

      {error && (
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg px-3 py-1.5 transition-colors"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
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
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-opacity"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-semibold)',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            opacity: isSaving ? 'var(--opacity-disabled)' : '1',
            cursor: isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </motion.li>
  );
};
