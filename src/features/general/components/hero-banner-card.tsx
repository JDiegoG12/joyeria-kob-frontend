/**
 * @file hero-banner-card.tsx
 * @description Tarjeta de configuración del banner hero principal
 * del panel de administración de Joyería KOB.
 *
 * ## Responsabilidad
 * Permite al administrador personalizar:
 * - Imagen de fondo del primer slide del carrusel (subida al servidor).
 * - Título principal (title) mostrado sobre la imagen.
 * - Subtítulo (subtitle) debajo del título.
 *
 * ## Comportamiento colapsable
 * La tarjeta muestra por defecto solo el encabezado con una previsualización
 * compacta de la imagen actual. El formulario completo se despliega al pulsar
 * "Editar banner" y se colapsa automáticamente tras guardar con éxito.
 *
 * ## Sistema de color — tokens sin valores quemados
 * Todos los colores provienen exclusivamente de tokens CSS definidos en
 * `tokens.css`. El patrón para el acento en dark mode es idéntico al del
 * `AdminSidebar`:
 *
 *   `var(--accent-vivid, var(--fallback-light))`
 *
 * - En **light mode** `--accent-vivid` no está definido → CSS cae al fallback.
 * - En **dark mode** `--accent-vivid` (#4A50C4) está definido en `.dark {}` de
 *   `tokens.css` → lo usa automáticamente.
 *
 * No se usa ningún bloque `<style>` inyectado, ni selectores `.dark` en el
 * componente, ni valores hexadecimales directos. Mismo patrón que `AdminSidebar`
 * para íconos activos y bordes de acento.
 *
 * ## Almacenamiento
 * Los cambios se persisten en el backend via `PUT /api/banner` (multipart/form-data).
 * El store `useHeroBannerStore` actúa como capa intermedia: expone `saveBanner`,
 * `isSaving` y `saveError`, que esta tarjeta consume directamente.
 *
 * ## Restricciones de imagen
 * Tamaño recomendado: 1920 × 800 px.
 * Formatos aceptados: JPG, PNG, WebP.
 * La imagen se envía como `File` — ya no se convierte a base64.
 *
 * ## Flujo de uso
 * 1. El admin abre esta tarjeta en `/admin/general`.
 * 2. Pulsa "Editar banner" — el formulario se despliega.
 * 3. Modifica la imagen o los textos del banner.
 * 4. Hace clic en "Guardar cambios" → se abre un `ConfirmModal`.
 * 5. Al confirmar, se llama a `saveBanner`.
 * 6. El store llama a `GeneralService.updateBanner` con `FormData`.
 * 7. El backend persiste los cambios y devuelve el banner actualizado.
 * 8. El resultado se comunica mediante toast de éxito o error.
 * 9. El formulario se colapsa automáticamente tras guardar con éxito.
 */

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Image, Save, Loader, ChevronUp, Pencil } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/modal/confirm-modal';
import {
  useHeroBannerStore,
  DEFAULT_BANNER_TEXT,
  DEFAULT_BANNER_SUBTITLE,
} from '@/store/hero-banner.store';
import { useToastStore } from '@/store/toast.store';
import DEFAULT_HERO_IMAGE from '@/assets/HERO_IMAGE.jpg';
/** Imagen local estática que se muestra cuando no hay imagen del backend. */

/** Formatos de imagen aceptados por el input file. */
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

// ─── Componente ────────────────────────────────────────────────────────────────

/**
 * Tarjeta de configuración del banner hero principal.
 *
 * Muestra un resumen compacto en estado colapsado y despliega el formulario
 * completo al pulsar "Editar banner". Sigue el mismo patrón visual que
 * `GoldPriceCard` y el mismo patrón de tokens de color que `AdminSidebar`.
 */
export const HeroBannerCard = () => {
  const {
    bannerText,
    bannerSubtitle,
    bannerImageUrl,
    isSaving,
    saveBanner,
    fetchBanner,
  } = useHeroBannerStore();
  const { showToast } = useToastStore();

  // ── Estado local del formulario ──────────────────────────────────────────
  const [localText, setLocalText] = useState(bannerText);
  const [localSubtitle, setLocalSubtitle] = useState(bannerSubtitle);

  /**
   * Controla si el panel de edición está expandido.
   * Por defecto colapsado — el admin solo lo abre cuando necesita editar.
   */
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Archivo de imagen seleccionado por el admin en esta sesión.
   * `null` = no se seleccionó ningún archivo nuevo (se conserva la imagen actual).
   */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  /** Controla la visibilidad del modal de confirmación de guardado. */
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  /**
   * URL temporal creada con `URL.createObjectURL` para previsualizar
   * el archivo antes de subirlo. Se revoca al cambiar de archivo o al desmontar.
   */
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Carga automática al montar ───────────────────────────────────────────

  /**
   * Solicita los datos actuales del banner desde el backend al montar.
   * Garantiza que el formulario siempre muestre la información real.
   */
  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  /**
   * Sincronización bidireccional con el store.
   * Solo sincroniza si el usuario no está editando activamente (isDirty === false)
   * para no sobrescribir lo que está escribiendo.
   */
  useEffect(() => {
    if (!isDirty) {
      setLocalText(bannerText);
      setLocalSubtitle(bannerSubtitle);
    }
  }, [bannerText, bannerSubtitle, isDirty]);

  // ── Manejo de imagen ─────────────────────────────────────────────────────

  /**
   * Guarda el `File` seleccionado y crea una URL de objeto para la previsualización.
   * Revoca la URL anterior para evitar memory leaks.
   */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewObjectUrl(objectUrl);
    setIsDirty(true);
  };

  /** Descarta el archivo seleccionado y vuelve a mostrar la imagen del servidor. */
  const handleRemoveImage = () => {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    setSelectedFile(null);
    setPreviewObjectUrl(null);
    setIsDirty(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Guardar ──────────────────────────────────────────────────────────────

  /**
   * Abre el modal de confirmación antes de persistir los cambios.
   * El botón ya está deshabilitado si no hay cambios, pero se deja una
   * validación defensiva por si el handler se invoca directamente.
   */
  const handleSaveClick = () => {
    if (!isDirty || isSaving) return;
    setIsConfirmOpen(true);
  };

  /**
   * Llama a `saveBanner` del store tras la confirmación del admin.
   * Si el admin no seleccionó un archivo nuevo, `imageFile` no se incluye
   * y el backend conserva la imagen actual. El resultado se anuncia por toast.
   */
  const handleConfirmSave = async () => {
    const success = await saveBanner({
      title: localText.trim() || DEFAULT_BANNER_TEXT,
      subtitle: localSubtitle.trim() || DEFAULT_BANNER_SUBTITLE,
      ...(selectedFile ? { imageFile: selectedFile } : {}),
    });

    if (success) {
      setIsDirty(false);
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      setSelectedFile(null);
      setPreviewObjectUrl(null);
      setIsExpanded(false);
      showToast('success', 'Banner principal actualizado correctamente.');
    } else {
      showToast(
        'error',
        'No se pudieron guardar los cambios del banner. Intenta de nuevo.',
      );
    }

    setIsConfirmOpen(false);
  };

  // ── Restaurar valores ────────────────────────────────────────────────────

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

  /**
   * Colapsa el panel descartando cambios pendientes.
   * Llama a `handleReset` antes de cerrar para limpiar el formulario.
   */
  const handleCollapse = () => {
    if (isDirty) handleReset();
    setIsExpanded(false);
  };

  // ── Imagen a mostrar ─────────────────────────────────────────────────────
  // Prioridad: objeto URL local > URL del servidor > imagen estática por defecto
  const previewImage = previewObjectUrl ?? bannerImageUrl ?? DEFAULT_HERO_IMAGE;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="rounded-[var(--radius-md)] border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* ── Encabezado siempre visible ──────────────────────────────────── */}
        <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
          {/*
           * Ícono de la tarjeta.
           *
           * Patrón de color idéntico al AdminSidebar (íconos activos):
           *   color: var(--accent-vivid, var(--accent))
           *
           * · Light mode → --accent-vivid no existe → CSS usa el fallback --accent (#131638).
           *   Contraste OK sobre --accent-subtle (fondo rgba 8% del mismo azul).
           * · Dark mode  → --accent-vivid (#4A50C4) definido en .dark{} de tokens.css →
           *   ratio ~3.2:1 sobre --bg-secondary (#222222), cumple WCAG AA para UI (≥ 3:1).
           *
           * Sin colores quemados. Sin selectores .dark en el componente.
           */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-vivid, var(--accent))',
            }}
          >
            <Image size={20} />
          </div>

          {/* Textos del encabezado */}
          <div className="min-w-0 flex-1">
            <h3
              className="text-[0.98rem] sm:text-[var(--text-base)]"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Banner principal
            </h3>
            <p
              className="mt-0.5 truncate text-[0.8rem] sm:text-[var(--text-sm)]"
              style={{
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-muted)',
              }}
            >
              {isExpanded
                ? 'Imagen y texto del primer slide del carrusel (1920 × 800 px recomendado).'
                : bannerText || DEFAULT_BANNER_TEXT}
            </p>
          </div>

          {/*
           * Botón toggle.
           *
           * Estado cerrado: replica el botón de "Actualizar" de GoldPriceCard.
           * Usa azul principal en light y `--accent-vivid` en dark con fallback CSS.
           * Estado abierto: color --text-muted, que tiene contraste suficiente en ambos modos.
           *
           * `cursor-pointer` explícito: algunos resets CSS eliminan el cursor por defecto
           * en <button> fuera de <form>.
           */}
          <button
            type="button"
            onClick={() =>
              isExpanded ? handleCollapse() : setIsExpanded(true)
            }
            aria-expanded={isExpanded}
            aria-controls="hero-banner-form"
            className="flex flex-shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.78rem] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[var(--text-sm)] transition-opacity hover:opacity-85 active:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 'var(--font-semibold)',
              color: isExpanded ? 'var(--text-muted)' : 'var(--accent-text)',
              backgroundColor: isExpanded
                ? 'transparent'
                : 'var(--accent-vivid, var(--accent))',
              border: isExpanded ? '1px solid var(--border-color)' : 'none',
              opacity: 1,
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={15} aria-hidden="true" />
                Cerrar
              </>
            ) : (
              <>
                <Pencil size={14} aria-hidden="true" />
                Editar banner
              </>
            )}
          </button>
        </div>

        {/*
         * ── Previsualización compacta (solo cuando colapsado) ───────────────
         *
         * Proporción 16:5 para ocupar menos espacio vertical en estado colapsado.
         * El gradiente inferior es una superposición de UI estándar (negro semitransparente)
         * para legibilidad de texto sobre imagen — no es un color de marca.
         */}
        {!isExpanded && (
          <div
            className="relative mx-4 mb-4 overflow-hidden sm:mx-6 sm:mb-5"
            style={{
              aspectRatio: '16 / 5',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          >
            <img
              src={previewImage}
              alt="Previsualización actual del banner"
              className="h-full w-full object-cover"
            />
            {/* Gradiente de legibilidad — overlay estándar para texto sobre imagen */}
            <div
              className="absolute inset-0 flex flex-col justify-end px-4 py-3"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)',
              }}
            >
              <p
                className="truncate"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'rgba(255,255,255,0.95)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                }}
              >
                {bannerText || DEFAULT_BANNER_TEXT}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: '1px',
                }}
              >
                Pulsa "Editar banner" para modificar
              </p>
            </div>
          </div>
        )}

        {/*
         * ── Panel de edición colapsable ─────────────────────────────────────
         *
         * `display` condicional en lugar de unmount para conservar el estado
         * del formulario entre aperturas. `id` vincula con `aria-controls`.
         */}
        <div
          id="hero-banner-form"
          style={{ display: isExpanded ? 'block' : 'none' }}
        >
          <div
            className="mx-4 mb-4 h-px sm:mx-6 sm:mb-5"
            style={{ backgroundColor: 'var(--border-color)' }}
          />

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {/* Etiqueta de sección */}
            <div className="mb-4 flex items-center justify-between">
              <p
                className="text-[0.7rem] sm:text-[var(--text-xs)]"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                Editar contenido
              </p>
            </div>

            {/* ── Previsualización de imagen (formulario expandido) ─────────── */}
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

              <div
                className="relative mb-3 overflow-hidden"
                style={{
                  aspectRatio: '16 / 9',
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
                <div
                  className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 sm:px-3"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--accent-active) 72%, transparent)',
                  }}
                >
                  <p
                    className="text-[0.72rem] sm:text-[var(--text-xs)]"
                    style={{
                      fontFamily: 'var(--font-ui)',
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
                  className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 text-[0.82rem] sm:gap-2 sm:text-[var(--text-sm)] transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--accent-text)',
                    backgroundColor: 'var(--accent)',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                  }}
                >
                  <Image size={14} aria-hidden="true" />
                  {selectedFile ? 'Cambiar imagen' : 'Subir imagen'}
                </button>

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSaving}
                    className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 text-[0.82rem] sm:gap-2 sm:text-[var(--text-sm)] transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed"
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontWeight: 'var(--font-medium)',
                      color: 'var(--text-primary)',
                      backgroundColor: 'transparent',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
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

              {selectedFile && (
                <p
                  className="mt-2 text-[0.76rem] sm:text-[var(--text-xs)]"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Archivo seleccionado: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>

            {/* ── Campo: Título del banner ──────────────────────────────────── */}
            <div className="mb-4">
              <label
                htmlFor="banner-text"
                className="text-[0.9rem] sm:text-[var(--text-sm)]"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-ui)',
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
                className="w-full px-3 py-2.5 text-[0.92rem] sm:text-[var(--text-sm)] transition-colors duration-200 disabled:opacity-60"
                style={{
                  fontFamily: 'var(--font-ui)',
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
                className="mt-1 text-right text-[0.76rem] sm:text-[var(--text-xs)]"
                style={{
                  fontFamily: 'var(--font-ui)',
                  color: 'var(--text-muted)',
                }}
              >
                {localText.length}/80
              </p>
            </div>

            {/* ── Campo: Subtítulo del banner ───────────────────────────────── */}
            <div className="mb-5">
              <label
                htmlFor="banner-subtitle"
                className="text-[0.9rem] sm:text-[var(--text-sm)]"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-ui)',
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
                className="w-full resize-none px-3 py-2.5 text-[0.92rem] sm:text-[var(--text-sm)] transition-colors duration-200 disabled:opacity-60"
                style={{
                  fontFamily: 'var(--font-ui)',
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
                className="mt-1 text-right text-[0.76rem] sm:text-[var(--text-xs)]"
                style={{
                  fontFamily: 'var(--font-ui)',
                  color: 'var(--text-muted)',
                }}
              >
                {localSubtitle.length}/200
              </p>
            </div>

            {/* ── Pie: botón guardar ───────────────────────────────────────── */}
            <div className="flex items-center justify-end">
              {/* Botón guardar — spinner mientras `isSaving` es true */}
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={!isDirty || isSaving}
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[0.82rem] sm:text-[var(--text-sm)] transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--accent-text)',
                  backgroundColor:
                    isDirty && !isSaving
                      ? 'var(--accent)'
                      : 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  opacity: isDirty && !isSaving ? 1 : 'var(--opacity-disabled)',
                }}
              >
                {isSaving ? (
                  <>
                    <Loader
                      size={14}
                      className="animate-spin"
                      aria-hidden="true"
                    />
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
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        variant="info"
        title="Confirmar cambios"
        message="¿Estás seguro de actualizar los datos del banner principal? Este cambio se verá reflejado en la página de inicio."
        confirmLabel="Sí, guardar"
        cancelLabel="Cancelar"
        isLoading={isSaving}
        onConfirm={() => void handleConfirmSave()}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};
