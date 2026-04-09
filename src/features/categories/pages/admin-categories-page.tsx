/**
 * @file admin-categories-page.tsx
 * @description Vista principal de Gestión de Categorías del panel admin de Joyería KOB.
 *
 * ## Estructura
 * - Encabezado con título, descripción y botón "Nueva Categoría"
 * - Grid responsive de `CategoryCard` (1 col mobile / 2 tablet / 3 desktop)
 * - `CategoryDrawer` montado siempre — se muestra/oculta según el store
 *
 * ## Estados
 * - **Cargando**: Skeleton animado de tarjetas
 * - **Error**: Mensaje de error con botón de reintento
 * - **Vacío**: Estado vacío con CTA para crear la primera categoría
 * - **Con datos**: Grid de tarjetas
 *
 * ## Carga de datos
 * Se dispara en `useEffect` al montar. El store evita cargas duplicadas
 * si ya hay datos (`force = false` por defecto).
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Plus, RefreshCw, Tag } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import { CategoryCard } from '@/features/categories/components/category-card';
import { CategoryDrawer } from '@/features/categories/components/category-drawer';

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Página de gestión de categorías del panel de administración.
 * Se monta en la ruta `/admin/categorias`.
 */
export const AdminCategoriesPage = () => {
  const { categories, isLoading, error, openCreate, loadCategories } =
    useCategoryStore();

  // Carga inicial de categorías
  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // Solo muestra categorías raíz en el grid (parentId === null)
  const rootCategories = categories.filter((cat) => cat.parentId === null);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="mx-auto max-w-7xl">
        {/* ── Encabezado ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
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
              Administra la estructura de categorías y subcategorías del
              catálogo.
            </p>
          </div>

          {/* Botón Nueva Categoría */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl px-5 py-3 transition-opacity"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-text)',
              boxShadow: 'var(--shadow-gold)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = String(0.9);
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
          >
            <Plus size={17} />
            Nueva categoría
          </button>
        </motion.div>

        {/* ── Contador ─────────────────────────────────────────────────────── */}
        {!isLoading && !error && rootCategories.length > 0 && (
          <motion.p
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
            {rootCategories.length}{' '}
            {rootCategories.length === 1
              ? 'categoría encontrada'
              : 'categorías encontradas'}
          </motion.p>
        )}

        {/* ── Estado: cargando ─────────────────────────────────────────────── */}
        {isLoading && <SkeletonGrid />}

        {/* ── Estado: error ────────────────────────────────────────────────── */}
        {!isLoading && error && (
          <ErrorState
            message={error}
            onRetry={() => void loadCategories(true)}
          />
        )}

        {/* ── Estado: sin categorías ───────────────────────────────────────── */}
        {!isLoading && !error && rootCategories.length === 0 && (
          <EmptyState onCreateClick={openCreate} />
        )}

        {/* ── Estado: grid de tarjetas ─────────────────────────────────────── */}
        {!isLoading && !error && rootCategories.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rootCategories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

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
      <div
        key={i}
        className="flex flex-col gap-4 rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Cabecera skeleton */}
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 animate-pulse rounded-xl"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
          <div
            className="h-5 w-2/3 animate-pulse rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
        </div>
        {/* Slug skeleton */}
        <div
          className="h-5 w-1/3 animate-pulse rounded-md"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
        {/* Descripción skeleton */}
        <div className="flex flex-col gap-2">
          <div
            className="h-4 w-full animate-pulse rounded-md"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
          <div
            className="h-4 w-4/5 animate-pulse rounded-md"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
        </div>
        {/* Footer skeleton */}
        <div
          className="h-4 w-1/2 animate-pulse rounded-md pt-1"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
          }}
        />
      </div>
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
    <button
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
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      <RefreshCw size={15} />
      Intentar de nuevo
    </button>
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
    <button
      onClick={onCreateClick}
      className="flex items-center gap-2 rounded-xl px-6 py-3 transition-opacity"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-semibold)',
        backgroundColor: 'var(--accent)',
        color: 'var(--accent-text)',
        boxShadow: 'var(--shadow-gold)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = String(0.9);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
      }}
    >
      <Plus size={16} />
      Crear primera categoría
    </button>
  </motion.div>
);
