/**
 * @file promo-banner.store.ts
 * @description Store Zustand para los banners de promoción del carrusel hero.
 *
 * ## Responsabilidades
 * - Cargar los banners desde el backend (`fetchBanners`) — usado tanto por el
 *   carrusel público de la home como por el panel admin.
 * - CRUD + reordenamiento desde el panel admin.
 *
 * Tras cada mutación se vuelve a sincronizar la lista con el servidor (o con la
 * respuesta de la operación) para mantener consistencia entre administradores y
 * reflejar el recompactado de posiciones que hace el backend al eliminar.
 *
 * No persiste en localStorage: los datos vienen siempre del backend.
 */
import { create } from 'zustand';
import { promoBannerService } from '@/features/promotions/services/promo-banner.service';
import type {
  PromoBanner,
  CreatePromoBannerPayload,
  UpdatePromoBannerPayload,
  ReorderPromoBannerItem,
} from '@/features/promotions/types/promotion.types';

interface PromoBannerState {
  /** Lista de banners ordenada por posición. */
  banners: PromoBanner[];

  /** `true` mientras se ejecuta `fetchBanners`. */
  isFetching: boolean;
  /** Mensaje de error de la última carga, o `null`. */
  fetchError: string | null;

  /** `true` mientras se ejecuta una mutación (create/update/delete/reorder). */
  isSaving: boolean;
  /** Mensaje de error de la última mutación, o `null`. */
  saveError: string | null;

  /** Carga los banners desde el backend. */
  fetchBanners: () => Promise<void>;
  /** Crea un banner. Devuelve `true` si fue exitoso. */
  createBanner: (payload: CreatePromoBannerPayload) => Promise<boolean>;
  /** Actualiza un banner. Devuelve `true` si fue exitoso. */
  updateBanner: (
    id: number,
    payload: UpdatePromoBannerPayload,
  ) => Promise<boolean>;
  /** Elimina un banner. Devuelve `true` si fue exitoso. */
  deleteBanner: (id: number) => Promise<boolean>;
  /** Reordena los banners. Devuelve `true` si fue exitoso. */
  reorderBanners: (items: ReorderPromoBannerItem[]) => Promise<boolean>;
}

export const usePromoBannerStore = create<PromoBannerState>()((set) => ({
  banners: [],
  isFetching: false,
  fetchError: null,
  isSaving: false,
  saveError: null,

  fetchBanners: async () => {
    set({ isFetching: true, fetchError: null });
    try {
      const banners = await promoBannerService.getAll();
      set({ banners, isFetching: false });
    } catch {
      set({
        isFetching: false,
        fetchError: 'No se pudieron cargar los banners de promoción.',
      });
    }
  },

  createBanner: async (payload) => {
    set({ isSaving: true, saveError: null });
    try {
      const created = await promoBannerService.create(payload);
      set((state) => ({
        banners: [...state.banners, created].sort(
          (a, b) => a.position - b.position,
        ),
        isSaving: false,
      }));
      return true;
    } catch {
      set({
        isSaving: false,
        saveError: 'No se pudo crear el banner. Intenta de nuevo.',
      });
      return false;
    }
  },

  updateBanner: async (id, payload) => {
    set({ isSaving: true, saveError: null });
    try {
      const updated = await promoBannerService.update(id, payload);
      set((state) => ({
        banners: state.banners
          .map((b) => (b.id === id ? updated : b))
          .sort((a, b) => a.position - b.position),
        isSaving: false,
      }));
      return true;
    } catch {
      set({
        isSaving: false,
        saveError: 'No se pudo actualizar el banner. Intenta de nuevo.',
      });
      return false;
    }
  },

  deleteBanner: async (id) => {
    set({ isSaving: true, saveError: null });
    try {
      await promoBannerService.remove(id);
      // Refetch para reflejar el recompactado de posiciones del backend.
      const banners = await promoBannerService.getAll();
      set({ banners, isSaving: false });
      return true;
    } catch {
      set({
        isSaving: false,
        saveError: 'No se pudo eliminar el banner. Intenta de nuevo.',
      });
      return false;
    }
  },

  reorderBanners: async (items) => {
    set({ isSaving: true, saveError: null });
    try {
      const banners = await promoBannerService.reorder(items);
      set({ banners, isSaving: false });
      return true;
    } catch {
      set({
        isSaving: false,
        saveError: 'No se pudo reordenar. Intenta de nuevo.',
      });
      return false;
    }
  },
}));
