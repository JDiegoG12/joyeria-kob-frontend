/**
 * @file hero-banner-card.tsx
 * @description Tarjeta de configuración del banner hero principal
 * del panel de administración de Joyería KOB.
 *
 * Permite al administrador personalizar:
 * - **Imagen de fondo** del primer slide del carrusel (subida desde archivo local).
 * - **Título principal** (bannerText) mostrado sobre la imagen.
 * - **Subtítulo** (bannerSubtitle) debajo del título.
 *
 * ## Almacenamiento
 * Por ahora persiste en `localStorage` via `useHeroBannerStore`.
 * Cuando el backend exponga el endpoint, reemplazar `setBannerConfig` por
 * una llamada a `GeneralService.updateHeroBanner(...)`.
 *
 * ## Restricciones de imagen
 * - Tamaño recomendado: 1920 × 800 px.
 * - Formatos aceptados: JPG, PNG, WebP.
 * - La imagen se convierte a base64 para almacenarse en localStorage.
 * - Se muestra una advertencia si el archivo supera 2 MB (localStorage tiene límite ~5 MB).
 *
 * ## Flujo de uso
 * 1. El admin abre esta tarjeta en `/admin/general`.
 * 2. Sube o escribe los datos del banner.
 * 3. Hace clic en "Guardar cambios" → los datos se persisten en el store.
 * 4. La home page refleja los cambios automáticamente en el siguiente render.
 */

import { useState, useRef, type ChangeEvent } from 'react';
import {
  Image,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  useHeroBannerStore,
  DEFAULT_BANNER_TEXT,
  DEFAULT_BANNER_SUBTITLE,
} from '@/store/hero-banner.store';

/** Peso máximo de imagen en bytes antes de mostrar advertencia (2 MB). */
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

/** Formatos de imagen aceptados por el input file. */
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

// ─── Componente ────────────────────────────────────────────────────────────────

/**
 * Tarjeta de configuración del banner hero principal.
 * Sigue el mismo patrón visual que `GoldPriceCard`.
 */
export const HeroBannerCard = () => {
  const {
    bannerText,
    bannerSubtitle,
    bannerImageUrl,
    setBannerConfig,
    resetBanner,
  } = useHeroBannerStore();

  // ── Estado local del formulario ──────────────────────────────────────────
  const [localText, setLocalText] = useState(bannerText);
  const [localSubtitle, setLocalSubtitle] = useState(bannerSubtitle);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(
    bannerImageUrl,
  );
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>(
    'idle',
  );
  const [isDirty, setIsDirty] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Manejo de imagen ─────────────────────────────────────────────────────

  /**
   * Convierte la imagen seleccionada a base64 y actualiza el estado local.
   * Muestra advertencia si el archivo supera `MAX_IMAGE_SIZE_BYTES`.
   */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageWarning(null);

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageWarning(
        `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Se recomienda usar imágenes menores a 2 MB para evitar problemas de almacenamiento.`,
      );
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLocalImageUrl(base64);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  /** Elimina la imagen personalizada y vuelve a la imagen estática por defecto. */
  const handleRemoveImage = () => {
    setLocalImageUrl(null);
    setImageWarning(null);
    setIsDirty(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Guardar ──────────────────────────────────────────────────────────────

  /** Persiste los cambios en el store (y por ende en localStorage). */
  const handleSave = () => {
    try {
      setBannerConfig({
        bannerText: localText.trim() || DEFAULT_BANNER_TEXT,
        bannerSubtitle: localSubtitle.trim() || DEFAULT_BANNER_SUBTITLE,
        bannerImageUrl: localImageUrl,
      });
      setSaveStatus('saved');
      setIsDirty(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  // ── Restaurar valores por defecto ────────────────────────────────────────

  /** Restaura el banner a los valores originales de la aplicación. */
  const handleReset = () => {
    resetBanner();
    setLocalText(DEFAULT_BANNER_TEXT);
    setLocalSubtitle(DEFAULT_BANNER_SUBTITLE);
    setLocalImageUrl(null);
    setImageWarning(null);
    setIsDirty(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Render ───────────────────────────────────────────────────────────────

  /** Imagen a mostrar en la previsualización (local o la guardada). */
  const previewImage = localImageUrl ?? 'src/assets/HERO_IMAGE.jpg';

  return (
    <div
      className="rounded-[var(--radius-md)] border p-5 sm:p-6"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* ── Encabezado de la tarjeta ────────────────────────────────────── */}
      <div
        className="mb-5 flex items-start justify-between gap-4 border-b pb-4"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            Banner principal
          </h3>
          <p
            className="mt-0.5"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            Imagen y texto del primer slide del carrusel (1920 × 800 px
            recomendado).
          </p>
        </div>

        {/* Botón de restaurar */}
        <button
          type="button"
          onClick={handleReset}
          title="Restaurar valores por defecto"
          className="flex shrink-0 items-center gap-1.5 transition-opacity duration-200 hover:opacity-70"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <RotateCcw size={13} aria-hidden="true" />
          Restaurar
        </button>
      </div>

      {/* ── Previsualización de imagen ──────────────────────────────────── */}
      <div className="mb-5">
        <label
          style={{
            display: 'block',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Imagen de fondo
        </label>

        {/* Área de previsualización */}
        <div
          className="relative mb-3 overflow-hidden"
          style={{
            aspectRatio: '1920 / 800',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        >
          <img
            src={previewImage}
            alt="Previsualización del banner"
            className="h-full w-full object-cover"
          />
          {/* Overlay con dimensiones sugeridas */}
          <div
            className="absolute bottom-0 left-0 right-0 px-3 py-1.5"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--bg-overlay) 70%, transparent)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-inverse)',
            }}
          >
            Previsualización · relación 1920 × 800
          </div>
        </div>

        {/* Botones de imagen */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 transition-opacity duration-200 hover:opacity-80"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--accent-text)',
              backgroundColor: 'var(--accent)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Image size={14} aria-hidden="true" />
            {localImageUrl ? 'Cambiar imagen' : 'Subir imagen'}
          </button>

          {localImageUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="inline-flex items-center gap-2 px-3 py-2 transition-opacity duration-200 hover:opacity-80"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              Usar imagen por defecto
            </button>
          )}
        </div>

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={handleImageChange}
          className="sr-only"
          aria-label="Seleccionar imagen del banner"
        />

        {/* Advertencia de tamaño de archivo */}
        {imageWarning && (
          <div
            className="mt-2 flex items-start gap-2 rounded-[var(--radius-sm)] p-3"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--color-warning) 12%, transparent)',
              border:
                '1px solid color-mix(in srgb, var(--color-warning) 35%, transparent)',
            }}
          >
            <AlertTriangle
              size={14}
              style={{
                color: 'var(--color-warning)',
                flexShrink: 0,
                marginTop: 1,
              }}
              aria-hidden="true"
            />
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-primary)',
                lineHeight: 'var(--leading-normal)',
              }}
            >
              {imageWarning}
            </p>
          </div>
        )}
      </div>

      {/* ── Campo: Título del banner ────────────────────────────────────── */}
      <div className="mb-4">
        <label
          htmlFor="banner-text"
          style={{
            display: 'block',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          Título principal
        </label>
        <input
          id="banner-text"
          type="text"
          value={localText}
          maxLength={80}
          onChange={(e) => {
            setLocalText(e.target.value);
            setIsDirty(true);
          }}
          placeholder={DEFAULT_BANNER_TEXT}
          className="w-full px-3 py-2.5 transition-colors duration-200"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-accent)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        />
        <p
          className="mt-1 text-right"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {localText.length}/80
        </p>
      </div>

      {/* ── Campo: Subtítulo del banner ─────────────────────────────────── */}
      <div className="mb-5">
        <label
          htmlFor="banner-subtitle"
          style={{
            display: 'block',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          Subtítulo
        </label>
        <textarea
          id="banner-subtitle"
          value={localSubtitle}
          maxLength={200}
          rows={3}
          onChange={(e) => {
            setLocalSubtitle(e.target.value);
            setIsDirty(true);
          }}
          placeholder={DEFAULT_BANNER_SUBTITLE}
          className="w-full resize-none px-3 py-2.5 transition-colors duration-200"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            lineHeight: 'var(--leading-normal)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-accent)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        />
        <p
          className="mt-1 text-right"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {localSubtitle.length}/200
        </p>
      </div>

      {/* ── Pie: estado + botón guardar ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        {/* Feedback de guardado */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saved' && (
            <>
              <CheckCircle
                size={14}
                style={{ color: 'var(--color-success)' }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-success)',
                }}
              >
                Cambios guardados
              </span>
            </>
          )}
          {saveStatus === 'error' && (
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-error)',
              }}
            >
              Error al guardar. Intenta de nuevo.
            </span>
          )}
        </div>

        {/* Botón guardar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className="inline-flex items-center gap-2 px-4 py-2.5 transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--accent-text)',
            backgroundColor: isDirty ? 'var(--accent)' : 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: isDirty ? 'pointer' : 'not-allowed',
            opacity: isDirty ? 1 : 'var(--opacity-disabled)',
          }}
        >
          <Save size={14} aria-hidden="true" />
          Guardar cambios
        </button>
      </div>
    </div>
  );
};
