/**
 * @file use-category-selector.ts
 * @description Hook reutilizable que encapsula la lógica del selector de
 * categorías en dos pasos para los formularios de creación y edición de joyas.
 *
 * ## Flujo de dos pasos
 * ```
 * Paso 1 → El usuario elige una categoría principal (ej: "Anillos")
 *           → Se cargan sus subcategorías automáticamente
 *
 * Paso 2 → El usuario elige una subcategoría (ej: "Compromiso") [opcional]
 *           → Si no elige ninguna, el categoryId final es el de la categoría principal
 *           → Si elige una, el categoryId final es el de la subcategoría
 * ```
 *
 * ## Regla de negocio
 * Una joya solo guarda un `categoryId`. Si tiene subcategoría, guarda el ID
 * de la subcategoría. Si no, guarda el ID de la categoría principal.
 * La selección de subcategoría es siempre opcional.
 *
 * ## Uso en formularios
 * ```tsx
 * import { useCategorySelector } from '@/features/catalog/hooks/use-category-selector';
 *
 * const {
 *   categories,
 *   isLoadingCategories,
 *   selectedParentId,
 *   selectedSubId,
 *   subCategories,
 *   resolvedCategoryId,
 *   selectParent,
 *   selectSub,
 *   reset,
 * } = useCategorySelector();
 *
 * // El ID final a enviar al backend
 * const categoryId = resolvedCategoryId; // número | null
 * ```
 */

import { useEffect, useMemo, useState } from 'react';
import { CategoryService } from '@/features/categories/services/category.service';
import type { Category } from '@/features/categories/types/category.types';

// ─── Tipos internos ───────────────────────────────────────────────────────────

/** Forma simplificada de una categoría para el selector. */
interface SelectorCategory {
    id: number;
    name: string;
}

/** Valores y acciones que expone el hook. */
export interface CategorySelectorState {
    /** Lista de categorías raíz disponibles. */
    categories: SelectorCategory[];
    /** `true` mientras se cargan las categorías del backend. */
    isLoadingCategories: boolean;
    /** Error de carga, o `null` si no hubo error. */
    categoriesError: string | null;
    /** ID de la categoría principal seleccionada en el paso 1. */
    selectedParentId: number | null;
    /** ID de la subcategoría seleccionada en el paso 2. */
    selectedSubId: number | null;
    /** Subcategorías de la categoría principal actualmente seleccionada. */
    subCategories: SelectorCategory[];
    /**
     * ID resuelto que debe enviarse al backend.
     * - Si hay subcategoría seleccionada → ID de la subcategoría.
     * - Si solo hay categoría principal → ID de la categoría principal.
     * - Si no hay nada seleccionado → `null`.
     */
    resolvedCategoryId: number | null;
    /**
     * Selecciona una categoría principal.
     * Limpia automáticamente cualquier subcategoría previamente seleccionada.
     *
     * @param parentId - ID de la categoría principal, o `null` para limpiar.
     */
    selectParent: (parentId: number | null) => void;
    /**
     * Selecciona una subcategoría dentro de la categoría principal activa.
     *
     * @param subId - ID de la subcategoría, o `null` para deseleccionar.
     */
    selectSub: (subId: number | null) => void;
    /**
     * Inicializa el selector con valores existentes.
     * Útil para el formulario de edición donde ya hay una categoría asignada.
     *
     * @param parentId - ID de la categoría principal.
     * @param subId    - ID de la subcategoría (opcional).
     */
    initializeWith: (parentId: number | null, subId?: number | null) => void;
    /** Resetea toda la selección a su estado inicial. */
    reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook que encapsula el flujo de selección de categoría en dos pasos
 * para los formularios de productos.
 *
 * Carga las categorías del backend al montarse y expone el `resolvedCategoryId`
 * listo para enviarse directamente al campo `categoryId` del backend.
 *
 * @returns Estado del selector y acciones para controlarlo.
 */
export const useCategorySelector = (): CategorySelectorState => {
    const [rawCategories, setRawCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedSubId, setSelectedSubId] = useState<number | null>(null);

    // Carga las categorías raíz con sus hijos al montar el hook
    useEffect(() => {
        const load = async () => {
            setIsLoadingCategories(true);
            setCategoriesError(null);
            try {
                const data = await CategoryService.getAll();
                setRawCategories(data);
            } catch {
                setCategoriesError(
                    'No se pudieron cargar las categorías. Intenta de nuevo.',
                );
            } finally {
                setIsLoadingCategories(false);
            }
        };

        void load();
    }, []);

    // Solo categorías raíz (parentId === null)
    const categories = useMemo<SelectorCategory[]>(
        () =>
            rawCategories
                .filter((cat) => cat.parentId === null)
                .map((cat) => ({ id: cat.id, name: cat.name })),
        [rawCategories],
    );

    // Subcategorías de la categoría principal seleccionada
    const subCategories = useMemo<SelectorCategory[]>(() => {
        if (selectedParentId === null) return [];
        const parent = rawCategories.find((cat) => cat.id === selectedParentId);
        if (!parent) return [];
        return (parent.children ?? []).map((child) => ({
            id: child.id,
            name: child.name,
        }));
    }, [rawCategories, selectedParentId]);

    // ID final que se envía al backend
    const resolvedCategoryId = useMemo<number | null>(() => {
        if (selectedSubId !== null) return selectedSubId;
        return selectedParentId;
    }, [selectedParentId, selectedSubId]);

    const selectParent = (parentId: number | null) => {
        setSelectedParentId(parentId);
        // Limpiar subcategoría al cambiar de categoría principal
        setSelectedSubId(null);
    };

    const selectSub = (subId: number | null) => {
        setSelectedSubId(subId);
    };

    const initializeWith = (
        parentId: number | null,
        subId: number | null = null,
    ) => {
        setSelectedParentId(parentId);
        setSelectedSubId(subId);
    };

    const reset = () => {
        setSelectedParentId(null);
        setSelectedSubId(null);
    };

    return {
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
        reset,
    };
};