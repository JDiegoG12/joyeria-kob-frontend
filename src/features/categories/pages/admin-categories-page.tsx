/**
 * @file admin-categories-page.tsx
 * @description Vista principal de Gestión de Categorías del panel admin de Joyería KOB.
 *
 * Estructura
 * - Encabezado con título, descripción y botón "Nueva Categoría"
 * - Buscador en tiempo real por nombre de categoría o subcategoría
 * - Grid responsive de `CategoryCard` (1 col mobile / 2 tablet / 3 desktop)
 * - `CategoryDrawer` montado siempre — se muestra/oculta según el store
 *
 * Estados
 * - Cargando: Skeleton animado de tarjetas
 * - Error: Mensaje de error con botón de reintento
 * - Vacío: Estado vacío con CTA para crear la primera categoría
 * - Con datos: Grid de tarjetas con animación `layout` al filtrar
 *
 * Carga de datos
 * Se dispara en `useEffect` al montar. El store evita cargas duplicadas
 * si ya hay datos (`force = false` por defecto).
 *
 * @see {@link https://github.com/user/repo/blob/main/README.md}
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Plus, RefreshCw, Search, Tag, X } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import { CategoryCard } from '@/features/categories/components/category-card';
import { CategoryDrawer } from '@/features/categories/components/category-drawer';
//import type { Category } from '@/features/categories/types/category.types';

// ─── Componente principal ─────────────────────────────────────────────────────
/**
 * Página de gestión de categorías del panel de administración.
 * Se monta en la ruta `/admin/categorias`.
 * Incluye buscador en tiempo real, animaciones no invasivas y feedback visual.
 */
export const AdminCategoriesPage = () => {
  const { categories, isLoading, error, openCreate, loadCategories } =
    useCategoryStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Carga inicial de categorías
  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // Lógica de filtrado recursivo por nombre
  const filteredRootCategories = useMemo(() => {
    const root = categories.filter((cat) => cat.parentId === null);
    if (!searchTerm.trim()) return root;

    const term = searchTerm.toLowerCase();
    return root.filter((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(term);
      const childMatch = cat.children.some((child) =>
        child.name.toLowerCase().includes(term),
      );
      return nameMatch || childMatch;
    });
  }, [categories, searchTerm]);

  const handleClearSearch = () => setSearchTerm('');

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex-1">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            Gestión de Categorías
          </h1>
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Administra la estructura de categorías y subcategorías del catálogo.
          </p>
        </div>

        {/* Botón Nueva Categoría (Feedback premium sin alterar cursor del SO) */}
        <motion.button
          onClick={openCreate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 sm:w-auto cursor-pointer transition-all duration-200"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'nowrap',
          }}
          onHoverStart={(e) => {
            if (!e.currentTarget) return; // Guarda contra desmontaje asíncrono
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--accent-hover)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              'var(--shadow-accent)';
          }}
          onHoverEnd={(e) => {
            if (!e.currentTarget) return; // Guarda contra desmontaje asíncrono
            (e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--accent)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              'var(--shadow-md)';
          }}
        >
          <Plus size={17} />
          Nueva categoría
        </motion.button>
      </motion.div>

      {/* ── Barra de búsqueda ───────────────────────────────────────────── */}
      {!isLoading && !error && categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-6 relative"
        >
          <div
            className="flex items-center rounded-xl border px-4 py-3 transition-all"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Search
              size={16}
              style={{ color: 'var(--text-muted)', flexShrink: 0 }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar categoría o subcategoría..."
              className="ml-3 w-full bg-transparent outline-none"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                (
                  e.currentTarget.parentElement as HTMLElement
                ).style.borderColor = 'var(--accent)';
                (e.currentTarget.parentElement as HTMLElement).style.boxShadow =
                  '0 0 0 3px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                (
                  e.currentTarget.parentElement as HTMLElement
                ).style.borderColor = 'var(--border-color)';
                (e.currentTarget.parentElement as HTMLElement).style.boxShadow =
                  'none';
              }}
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="ml-2 rounded-lg p-1 transition-colors"
                aria-label="Limpiar búsqueda"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'var(--bg-hover)';
                  (e.currentTarget as HTMLElement).style.color =
                    'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'transparent';
                  (e.currentTarget as HTMLElement).style.color =
                    'var(--text-muted)';
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Contador dinámico ───────────────────────────────────────────── */}
      {!isLoading && !error && filteredRootCategories.length > 0 && (
        <motion.p
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-5"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          {filteredRootCategories.length ===
          categories.filter((c) => c.parentId === null).length
            ? `${filteredRootCategories.length} categoría${filteredRootCategories.length !== 1 ? 's' : ''} encontrada${filteredRootCategories.length !== 1 ? 's' : ''}`
            : `${filteredRootCategories.length} categoría${filteredRootCategories.length !== 1 ? 's' : ''} coincide con "${searchTerm}"`}
        </motion.p>
      )}

      {/* ── Estado: cargando ─────────────────────────────────────────────── */}
      {isLoading && <SkeletonGrid />}

      {/* ── Estado: error ────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <ErrorState message={error} onRetry={() => void loadCategories(true)} />
      )}

      {/* ── Estado: sin categorías ───────────────────────────────────────── */}
      {!isLoading && !error && categories.length === 0 && (
        <EmptyState onCreateClick={openCreate} />
      )}

      {/* ── Estado: grid de tarjetas (con animación layout al filtrar) ───── */}
      {!isLoading && !error && filteredRootCategories.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filteredRootCategories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </motion.div>
      )}

      {/* ── Estado: sin resultados ───────────────────────────────────────── */}
      {!isLoading &&
        !error &&
        categories.length > 0 &&
        filteredRootCategories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Search size={32} style={{ color: 'var(--text-muted)' }} />
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-base)',
                color: 'var(--text-primary)',
              }}
            >
              No se encontraron resultados
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                maxWidth: '320px',
              }}
            >
              Intenta con otro término o crea una nueva categoría.
            </p>
            <button
              onClick={handleClearSearch}
              className="mt-2 rounded-xl px-4 py-2 transition-colors"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                backgroundColor: 'transparent',
              }}
            >
              Limpiar búsqueda
            </button>
          </motion.div>
        )}

      {/* Drawer — siempre montado, se muestra según el store */}
      <CategoryDrawer />
    </div>
  );
};

// ─── Subcomponente: skeleton de carga ─────────────────────────────────────────
/**
 * Grid de tarjetas esqueleto animadas durante la carga inicial.
 */
const SkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.05 }}
        className="flex flex-col gap-4 rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            height: '1.25rem',
            width: '65%',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <div
          style={{
            height: '0.75rem',
            width: '40%',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
          }}
        />
        <div
          style={{
            height: '3rem',
            width: '100%',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <div
          style={{
            height: '0.75rem',
            width: '30%',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            marginTop: '0.5rem',
          }}
        />
      </motion.div>
    ))}
  </div>
);

// ─── Subcomponente: estado de error ───────────────────────────────────────────
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}
/** Estado de error con mensaje y botón de reintento. */
const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
    }}
  >
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full"
      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
    >
      <AlertCircle size={24} style={{ color: 'var(--color-error)' }} />
    </div>
    <div className="text-center">
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
        }}
      >
        Error al cargar categorías
      </p>
      <p
        className="mt-1"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {message}
      </p>
    </div>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onRetry}
      className="flex items-center gap-2 rounded-xl px-5 py-2.5 transition-colors"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'transparent',
      }}
      onHoverStart={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          'var(--bg-hover)';
      }}
      onHoverEnd={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      <RefreshCw size={15} />
      Intentar de nuevo
    </motion.button>
  </motion.div>
);

// ─── Subcomponente: estado vacío ──────────────────────────────────────────────
interface EmptyStateProps {
  onCreateClick: () => void;
}
/** Estado vacío cuando no hay categorías creadas. */
const EmptyState = ({ onCreateClick }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center gap-5 rounded-2xl py-20"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px dashed var(--border-strong)',
    }}
  >
    <div
      className="flex h-16 w-16 items-center justify-center rounded-2xl"
      style={{ backgroundColor: 'var(--accent-subtle)' }}
    >
      <Tag size={28} style={{ color: 'var(--accent)' }} />
    </div>
    <div className="text-center">
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
        }}
      >
        Aún no hay categorías
      </p>
      <p
        className="mt-2"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        Crea la primera categoría para organizar el catálogo de joyas.
      </p>
    </div>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onCreateClick}
      className="flex items-center gap-2 rounded-xl px-6 py-3 transition-colors cursor-pointer"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-semibold)',
        backgroundColor: 'var(--accent)',
        color: 'var(--accent-text)',
        boxShadow: 'var(--shadow-md)',
      }}
      onHoverStart={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          'var(--accent-hover)';
        (e.currentTarget as HTMLElement).style.boxShadow =
          'var(--shadow-accent)';
      }}
      onHoverEnd={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          'var(--accent)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
      }}
    >
      <Plus size={16} />
      Crear primera categoría
    </motion.button>
  </motion.div>
);
