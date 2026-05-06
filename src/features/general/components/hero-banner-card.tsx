/**
 * @file hero-banner-card.tsx
 * @description Tarjeta de configuración del banner hero principal
 * del panel de administración de Joyería KOB.
 *
 * Permite al administrador personalizar:
 * - **Imagen de fondo** del primer slide del carrusel (subida al servidor).
 * - **Título principal** (title) mostrado sobre la imagen.
 * - **Subtítulo** (subtitle) debajo del título.
 *
 * ## Almacenamiento
 * Los cambios se persisten en el backend via `PUT /api/banner` (multipart/form-data).
 * El store `useHeroBannerStore` actúa como capa intermedia: expone `saveBanner`,
 * `isSaving` y `saveError`, que esta tarjeta consume directamente.
 *
 * ## Restricciones de imagen
 * - Tamaño recomendado: 1920 × 800 px.
 * - Formatos aceptados: JPG, PNG, WebP.
 * - La imagen se envía como `File` — ya no se convierte a base64.
 *
 * ## Flujo de uso
 * 1. El admin abre esta tarjeta en `/admin/general`.
 * 2. Modifica la imagen o los textos del banner.
 * 3. Hace clic en "Guardar cambios" → se llama a `saveBanner`.
 * 4. El store llama a `GeneralService.updateBanner` con `FormData`.
 * 5. El backend persiste los cambios y devuelve el banner actualizado.
 * 6. El store actualiza su estado → el carrusel de la home refleja los cambios.
 */

import { useState, useRef, type ChangeEvent } from 'react';
import { Image, RotateCcw, Save, CheckCircle, Loader } from 'lucide-react';
import {
  useHeroBannerStore,
  DEFAULT_BANNER_TEXT,
  DEFAULT_BANNER_SUBTITLE,
} from '@/store/hero-banner.store';

/** Imagen local estática que se muestra cuando no hay imagen del backend. */
const DEFAULT_HERO_IMAGE = 'src/assets/HERO_IMAGE.jpg';

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
    isSaving,
    saveError,
    saveBanner,
  } = useHeroBannerStore();

  // ── Estado local del formulario ──────────────────────────────────────────
  const [localText, setLocalText] = useState(bannerText);
  const [localSubtitle, setLocalSubtitle] = useState(bannerSubtitle);

  /**
   * Archivo de imagen seleccionado por el admin en esta sesión.
   * `null` = no se seleccionó ningún archivo nuevo (se conserva la imagen actual).
   */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * URL temporal de objeto creada con `URL.createObjectURL` para previsualizar
   * el archivo antes de subirlo. Se revoca al cambiar de archivo o al desmontar.
   */
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>(
    'idle',
  );
  const [isDirty, setIsDirty] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Manejo de imagen ─────────────────────────────────────────────────────

  /**
   * Guarda el `File` seleccionado y crea una URL de objeto para la previsualización.
   * Revoca la URL anterior para evitar memory leaks.
   */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revocar URL anterior si existía
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewObjectUrl(objectUrl);
    setIsDirty(true);
  };

  /** Descarta el archivo seleccionado y vuelve a mostrar la imagen del servidor. */
  const handleRemoveImage = () => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    setSelectedFile(null);
    setPreviewObjectUrl(null);
    setIsDirty(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Guardar ──────────────────────────────────────────────────────────────

  /**
   * Llama a `saveBanner` del store con los valores locales del formulario.
   * Si el admin no seleccionó un archivo nuevo, `imageFile` no se incluye
   * y el backend conserva la imagen actual.
   */
  const handleSave = async () => {
    const success = await saveBanner({
      title: localText.trim() || DEFAULT_BANNER_TEXT,
      subtitle: localSubtitle.trim() || DEFAULT_BANNER_SUBTITLE,
      // Solo se adjunta si el admin seleccionó una imagen nueva
      ...(selectedFile ? { imageFile: selectedFile } : {}),
    });

    if (success) {
      setSaveStatus('saved');
      setIsDirty(false);
      // Limpiar el archivo local — la imagen ya vive en el servidor
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      setSelectedFile(null);
      setPreviewObjectUrl(null);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  // ── Restaurar valores por defecto ────────────────────────────────────────

  /**
   * Descarta todos los cambios locales y vuelve a los valores actuales del store.
   * No llama al backend — solo resetea el formulario al último estado guardado.
   */
  const handleReset = () => {
    setLocalText(bannerText);
    setLocalSubtitle(bannerSubtitle);
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    setSelectedFile(null);
    setPreviewObjectUrl(null);
    setIsDirty(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Imagen a mostrar en la previsualización ──────────────────────────────
  // Prioridad: objeto URL local (nueva selección) > URL del servidor > imagen estática
  const previewImage = previewObjectUrl ?? bannerImageUrl ?? DEFAULT_HERO_IMAGE;

  // ── Render ───────────────────────────────────────────────────────────────

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

        {/* Botón de descartar cambios locales */}
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty || isSaving}
          title="Descartar cambios"
          className="flex shrink-0 items-center gap-1.5 transition-opacity duration-200 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: isDirty && !isSaving ? 'pointer' : 'not-allowed',
            padding: '4px 0',
          }}
        >
          <RotateCcw size={13} aria-hidden="true" />
          Descartar
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
            aspectRatio:
              '16 / 9' /* mismo ratio que el carrusel en producción */,
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
          {/* Dimensiones sugeridas sobre la imagen */}
          <div
            className="absolute bottom-0 left-0 right-0 px-3 py-1.5"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--accent-active) 72%, transparent)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              Formato recomendado: 1920 × 1080 px · JPG, PNG, WebP
            </p>
          </div>
        </div>

        {/* Acciones de imagen */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-3 py-2 transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--accent-text)',
              backgroundColor: 'var(--accent)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            <Image size={14} aria-hidden="true" />
            {selectedFile ? 'Cambiar imagen' : 'Subir imagen'}
          </button>

          {/* Solo muestra "Quitar imagen" si hay un archivo nuevo seleccionado */}
          {selectedFile && (
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-3 py-2 transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              Mantener imagen actual
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

        {/* Nombre del archivo seleccionado */}
        {selectedFile && (
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            Archivo seleccionado: {selectedFile.name} (
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
          </p>
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
          disabled={isSaving}
          onChange={(e) => {
            setLocalText(e.target.value);
            setIsDirty(true);
          }}
          placeholder={DEFAULT_BANNER_TEXT}
          className="w-full px-3 py-2.5 transition-colors duration-200 disabled:opacity-60"
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
          disabled={isSaving}
          onChange={(e) => {
            setLocalSubtitle(e.target.value);
            setIsDirty(true);
          }}
          placeholder={DEFAULT_BANNER_SUBTITLE}
          className="w-full resize-none px-3 py-2.5 transition-colors duration-200 disabled:opacity-60"
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
          {(saveStatus === 'error' || saveError) && (
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-error)',
              }}
            >
              {saveError ?? 'Error al guardar. Intenta de nuevo.'}
            </span>
          )}
        </div>

        {/* Botón guardar — muestra spinner mientras `isSaving` es true */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="inline-flex items-center gap-2 px-4 py-2.5 transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--accent-text)',
            backgroundColor:
              isDirty && !isSaving ? 'var(--accent)' : 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: isDirty && !isSaving ? 'pointer' : 'not-allowed',
            opacity: isDirty && !isSaving ? 1 : 'var(--opacity-disabled)',
          }}
        >
          {isSaving ? (
            <>
              {/* Spinner animado durante el guardado */}
              <Loader size={14} className="animate-spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            <>
              <Save size={14} aria-hidden="true" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
};
