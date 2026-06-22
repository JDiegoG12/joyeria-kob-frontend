/**
 * @file hero-carousel.tsx
 * @description Carrusel del banner hero principal de Joyería KOB.
 *
 * ## Estructura del carrusel
 * - **Slide 0** (siempre): Banner principal configurable desde el panel admin.
 *   Muestra imagen personalizada (o la imagen estática por defecto), el texto
 *   del banner, subtítulo y los botones de CTA al catálogo y WhatsApp.
 * - **Slides 1+**: Imágenes promocionales configuradas por separado (fuente
 *   distinta, pendiente de implementación en el backend).
 *
 * ## Comportamiento del carrusel
 * - Avance automático cada 6 segundos (pausado si hay interacción del usuario).
 * - Navegación por flechas laterales y por puntos indicadores.
 * - Transición con `opacity` + `translateX` suave (CSS transitions).
 * - Compatible con `prefers-reduced-motion`: sin animaciones si el usuario las desactiva.
 * - Responsive:
 *   - Desktop: altura fija 580px — los botones CTA quedan visibles sin scroll.
 *   - Mobile: mínimo 420px para mostrar texto y botones completos.
 *
 * ## Props
 * No recibe props — lee el store `useHeroBannerStore` directamente y recibe
 * los slides promocionales como prop para desacoplarse del origen de datos.
 *
 * @example
 * ```tsx
 * // En home-page.tsx:
 * <HeroCarousel promoSlides={PROMO_SLIDES} />
 * ```
 */

import { useState, useEffect, useCallback, useRef, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHeroBannerStore } from '@/store/hero-banner.store';
import { WhatsAppIcon } from '@/components/ui/social-icons';
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '@/config/contact';
import {
  buildUploadsSrcSet,
  BANNER_IMAGE_WIDTHS,
} from '@/shared/utils/image-srcset';
import DEFAULT_HERO_IMAGE from '@/assets/HERO_IMAGE.webp';

/** Duración en ms entre cambios automáticos de slide. */
const AUTO_ADVANCE_DELAY = 6000;

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Datos de un slide promocional (slides 1+).
 * Las imágenes del slide 0 vienen del store `useHeroBannerStore`.
 */
export interface PromoSlide {
  /** URL de la imagen de fondo del slide promocional. */
  imageUrl: string;
  /** Texto alternativo de la imagen para accesibilidad. */
  imageAlt: string;
  /**
   * Texto opcional superpuesto sobre la imagen.
   * Si es undefined, el slide muestra solo la imagen sin overlay de texto.
   */
  overlayText?: string;
  /** Subtítulo opcional mostrado bajo `overlayText`. */
  overlaySubtitle?: string;
  /** URL de destino al hacer clic en el slide promocional. */
  linkTo?: string;
}

interface HeroCarouselProps {
  /**
   * Slides promocionales (slides 1+).
   * El slide 0 siempre es el banner principal del store.
   */
  promoSlides?: PromoSlide[];
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Carrusel hero de la página de inicio.
 * El primer slide siempre es el banner configurable desde el panel admin.
 */
export const HeroCarousel = ({ promoSlides = [] }: HeroCarouselProps) => {
  const { bannerText, bannerSubtitle, bannerImageUrl, hasLoaded, fetchBanner } =
    useHeroBannerStore();

  // Obtiene el banner desde el backend al montar el carrusel.
  // Se ejecuta una sola vez — el store maneja el estado de carga internamente.
  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  const totalSlides = 1 + promoSlides.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Almacena la coordenada X del inicio del toque para detectar swipe horizontal.
  const touchStartX = useRef<number | null>(null);

  // Detecta si el usuario prefiere movimiento reducido
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Lógica de avance automático ────────────────────────────────────────────

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    if (totalSlides <= 1 || isPaused || prefersReducedMotion) return;

    timerRef.current = setInterval(goToNext, AUTO_ADVANCE_DELAY);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, isPaused, prefersReducedMotion, goToNext]);

  // Al cambiar de slide manualmente, reinicia el temporizador
  const handleManualNav = useCallback(
    (action: () => void) => {
      if (timerRef.current) clearInterval(timerRef.current);
      action();
      if (!prefersReducedMotion) {
        timerRef.current = setInterval(goToNext, AUTO_ADVANCE_DELAY);
      }
    },
    [goToNext, prefersReducedMotion],
  );

  /**
   * Registra la posición X inicial del toque para calcular la distancia del swipe.
   * Solo en móvil (el evento no se dispara con ratón en desktop).
   */
  const handleTouchStart = (e: TouchEvent<HTMLElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  /**
   * Al soltar el dedo, compara la posición final con la inicial.
   * Un desplazamiento > 60px hacia la izquierda avanza al siguiente slide;
   * hacia la derecha retrocede. Por debajo del umbral se ignora (fue un tap).
   */
  const handleTouchEnd = (e: TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff < -60) handleManualNav(goToNext);
    else if (diff > 60) handleManualNav(goToPrev);
    touchStartX.current = null;
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        /*
         * Altura reducida para que los botones CTA sean visibles sin scroll:
         * - Mobile:  mínimo 420px (suficiente para eyebrow + h1 + subtítulo + botones).
         * - Desktop: fijo en 580px, equivale a ~60vh en pantallas de 1080p.
         * Se elimina el valor de 800px anterior que ocultaba los botones en viewports
         * estándar de 768–900px de alto.
         */
        height: 'clamp(420px, 58vh, 580px)',
        backgroundColor: 'var(--accent)',
      }}
      aria-label="Carrusel de banner principal"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Pista de slides ─────────────────────────────────────────────── */}
      <div className="relative h-full w-full">
        {/* Slide 0: Banner principal configurable.
         *
         * La <img> está en el primer render (no se monta/desmonta por el estado
         * de carga del backend), es `eager` y `fetchpriority="high"`. Detrás hay
         * un placeholder de color de marca del tamaño exacto de la imagen, así
         * que nunca se ve un hueco ni un estado roto; la imagen real aparece con
         * un fade sobre ese color. Ver `MainBannerSlide` para el detalle.
         *
         * Solo el texto (título/subtítulo, que sí dependen del backend) muestra
         * un skeleton hasta que `hasLoaded` es true. */}
        <MainBannerSlide
          bannerImageUrl={bannerImageUrl}
          bannerText={bannerText}
          bannerSubtitle={bannerSubtitle}
          hasLoaded={hasLoaded}
          isActive={currentIndex === 0}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Slides 1+: Imágenes promocionales */}
        {promoSlides.map((slide, index) => (
          <PromoSlideItem
            key={slide.imageUrl}
            slide={slide}
            isActive={currentIndex === index + 1}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>

      {/* ── Controles de navegación (solo si hay más de un slide) ────────── */}
      {totalSlides > 1 && (
        <>
          {/* Flecha izquierda — solo en desktop; en móvil se usa swipe */}
          <button
            type="button"
            onClick={() => handleManualNav(goToPrev)}
            className="absolute top-1/2 left-4 z-20 hidden -translate-y-1/2 items-center justify-center transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 lg:flex lg:left-6"
            style={{
              width: 44,
              height: 44,
              backgroundColor:
                'color-mix(in srgb, var(--bg-overlay) 60%, transparent)',
              color: 'var(--accent-text)',
              borderRadius: 'var(--radius-full)',
              border:
                '1px solid color-mix(in srgb, var(--accent-text) 30%, transparent)',
              outline: 'none',
            }}
            aria-label="Slide anterior"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          {/* Flecha derecha — solo en desktop; en móvil se usa swipe */}
          <button
            type="button"
            onClick={() => handleManualNav(goToNext)}
            className="absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 items-center justify-center transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 lg:flex lg:right-6"
            style={{
              width: 44,
              height: 44,
              backgroundColor:
                'color-mix(in srgb, var(--bg-overlay) 60%, transparent)',
              color: 'var(--accent-text)',
              borderRadius: 'var(--radius-full)',
              border:
                '1px solid color-mix(in srgb, var(--accent-text) 30%, transparent)',
              outline: 'none',
            }}
            aria-label="Siguiente slide"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>

          {/* Indicadores de puntos */}
          <div
            className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
            role="tablist"
            aria-label="Navegación del carrusel"
          >
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={currentIndex === index}
                aria-label={`Ir al slide ${index + 1}`}
                onClick={() => handleManualNav(() => goToIndex(index))}
                className="transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  width: currentIndex === index ? 24 : 8,
                  height: 8,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor:
                    currentIndex === index
                      ? 'var(--accent-text)'
                      : 'color-mix(in srgb, var(--accent-text) 45%, transparent)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

// ─── Slide principal ───────────────────────────────────────────────────────────

interface MainBannerSlideProps {
  /**
   * URL remota del banner (`/uploads/banners/...`), o `null` si todavía no
   * llegó del backend o no hay banner configurado.
   */
  bannerImageUrl: string | null;
  bannerText: string;
  bannerSubtitle: string;
  /** `true` cuando ya llegó el banner del backend (texto real vs. skeleton). */
  hasLoaded: boolean;
  isActive: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Slide principal del carrusel con texto configurable y CTAs fijos.
 * Ocupa el 100% del área del carrusel y siempre es el slide 0.
 *
 * ── Carga del banner: LCP medible + CERO parpadeo ───────────────────────────
 * La imagen es el candidato a LCP de la home. Para lograr LCP rápido/medible y
 * sin ningún flash de imagen por defecto:
 *
 * - **Placeholder de color**: un degradado de marca SIEMPRE visible, del tamaño
 *   exacto de la imagen. Nunca se ve un hueco, un salto de layout ni un estado
 *   "roto"; solo color de marca hasta que la foto aparece encima.
 * - **Un solo `src`, sin swap**: antes se pintaba la imagen por defecto y luego
 *   se intercambiaba por la remota — ese swap era el "parpadeo feo" y, además,
 *   al cambiar el contenido del candidato a LCP, impedía medirlo (NO_LCP). Ahora
 *   el `src` se fija UNA vez cuando el fetch resuelve:
 *     · con banner configurado → la imagen remota (con `srcset`/miniatura);
 *     · 404 (sin banner) → la imagen por defecto empaquetada.
 *   Como la URL remota no se conoce hasta el fetch, no es posible pintarla antes
 *   sin mostrar primero la de por defecto (lo que el negocio rechaza): el
 *   placeholder de color cubre esa fracción de segundo.
 * - **`<img>` en el primer render**: nunca se monta/desmonta por estado; es
 *   `eager`, `fetchpriority="high"` y se desvanece (opacity) al decodificarse.
 *
 * El padding inferior se redujo de `pb-14` a `pb-10` para acompañar la menor
 * altura del contenedor y mantener los botones siempre visibles.
 */
const MainBannerSlide = ({
  bannerImageUrl,
  bannerText,
  bannerSubtitle,
  hasLoaded,
  isActive,
  prefersReducedMotion,
}: MainBannerSlideProps) => {
  // Se activa cuando la imagen del banner termina de decodificarse, para
  // desvanecerla sobre el placeholder de color.
  const [imgLoaded, setImgLoaded] = useState(false);

  // Fuente final, decidida una sola vez cuando el fetch resolvió. Antes de eso
  // queda `undefined` (solo se ve el placeholder de color), evitando el flash
  // de la imagen por defecto cuando sí hay un banner configurado.
  const resolvedSrc =
    bannerImageUrl ?? (hasLoaded ? DEFAULT_HERO_IMAGE : undefined);
  // Miniatura/srcset solo para la imagen remota; la de por defecto (empaquetada)
  // no vive en /uploads y se sirve tal cual.
  const srcSet = bannerImageUrl
    ? buildUploadsSrcSet(bannerImageUrl, BANNER_IMAGE_WIDTHS)
    : undefined;

  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: isActive ? 1 : 0,
        transition: prefersReducedMotion ? 'none' : 'opacity 600ms ease',
        zIndex: isActive ? 1 : 0,
      }}
      aria-hidden={!isActive}
    >
      <div className="absolute inset-0">
        {/* Placeholder: degradado de color de marca, del tamaño exacto de la
         * imagen. Es lo que se ve mientras la foto carga — nunca un hueco. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(135deg, var(--accent) 0%, var(--accent-active) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Imagen del banner — candidato a LCP. Carga prioritaria y se desvanece
         * sobre el placeholder. `src` undefined hasta que el fetch resuelve. */}
        <img
          src={resolvedSrc}
          srcSet={srcSet}
          sizes="100vw"
          alt="Banner principal de Joyería KOB"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          style={{
            opacity: prefersReducedMotion || imgLoaded ? 1 : 0,
            transition: prefersReducedMotion ? 'none' : 'opacity 300ms ease',
          }}
        />

    {/* Overlay degradado para legibilidad del texto.
     * Opacidades reducidas para que la imagen protagonice:
     * - Lateral izq: 88% → 62%, fade a 58% → 28%
     * - Inferior:    76% → 52%
     * El texto blanco sigue siendo legible sin que el azul tape la foto.
     */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(90deg,
            color-mix(in srgb, var(--accent-active) 62%, transparent) 0%,
            color-mix(in srgb, var(--accent-active) 28%, transparent) 46%,
            transparent 100%
          ),
          linear-gradient(0deg,
            color-mix(in srgb, var(--accent-active) 52%, transparent) 0%,
            transparent 42%
          )`,
      }}
      aria-hidden="true"
    />

    {/* Contenido de texto y CTAs */}
    <div
      className="relative z-10 mx-auto flex h-full items-end px-5 pb-10 pt-16 sm:px-6 sm:pb-12 lg:px-10"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <div className="max-w-3xl">
        {/* Título y subtítulo: texto real una vez cargado el banner; mientras
         * tanto, barras skeleton (la imagen y los CTAs ya están visibles). */}
        {hasLoaded ? (
          <>
            {/* Título principal (configurable) - TAMAÑO AUMENTADO */}
            <h1
              className="leading-tight tracking-display"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-bold)',
                lineHeight: 'var(--leading-tight)',
                letterSpacing: 'var(--tracking-display)',
                color: 'var(--accent-text)',
                // Tamaño responsivo muy grande:
                // - Móvil: 2.75rem (44px)
                // - Tablet: 4.5rem (72px)
                // - Desktop: 6.5rem (104px) - casi del tamaño del mockup
                fontSize: 'clamp(2.75rem, 8vw, 6.5rem)',
              }}
            >
              {bannerText}
            </h1>

            {/* Subtítulo (configurable) - TAMAÑO MODERADAMENTE AUMENTADO
             * Oculto en pantallas muy pequeñas para ganar espacio */}
            <p
              className="mt-3 max-w-2xl sm:mt-4"
              style={{
                fontFamily: 'var(--font-body)',
                // Tamaño aumentado moderadamente:
                // - Mobile: 1rem (16px) - se muestra en móvil ahora
                // - Desktop: 1.375rem (22px)
                fontSize: 'clamp(1rem, 2vw, 1.375rem)',
                lineHeight: 'var(--leading-relaxed)',
                color: 'var(--announcement-text)',
              }}
            >
              {bannerSubtitle}
            </p>
          </>
        ) : (
          <div
            className={prefersReducedMotion ? '' : 'animate-pulse'}
            aria-hidden="true"
          >
            <div
              className="h-12 w-3/4 sm:h-16 lg:h-20"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--accent-text) 22%, transparent)',
              }}
            />
            <div
              className="mt-3 h-12 w-1/2 sm:h-16 lg:h-20"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--accent-text) 22%, transparent)',
              }}
            />
            <div
              className="mt-6 h-4 w-full max-w-2xl sm:h-5"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--accent-text) 22%, transparent)',
              }}
            />
          </div>
        )}

        {/* CTAs fijos */}
        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
          {/* CTA primario — catálogo */}
          <Link
            to="/catalogo"
            className="inline-flex cursor-pointer items-center justify-center gap-2 px-5 py-2.5 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
            style={{
              backgroundColor: 'var(--accent-text)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-bold)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            Ver catálogo
            <ArrowRight size={16} aria-hidden="true" />
          </Link>

          {/* CTA secundario — WhatsApp con ícono */}
          <a
            href={buildWhatsAppUrl(WHATSAPP_MESSAGES.heroAdvisor)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center justify-center gap-2 border px-5 py-2.5 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
            style={{
              borderColor: 'var(--announcement-text)',
              color: 'var(--announcement-text)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-bold)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            Hablar con asesor
            {/* Ícono de WhatsApp — refuerza el canal de contacto */}
            <WhatsAppIcon size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

// ─── Slides promocionales ──────────────────────────────────────────────────────

interface PromoSlideItemProps {
  slide: PromoSlide;
  isActive: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Slide promocional genérico (slides 1+).
 * Muestra imagen de fondo con texto opcional superpuesto.
 * Al hacer clic redirige a `slide.linkTo` si está definido.
 */
const PromoSlideItem = ({
  slide,
  isActive,
  prefersReducedMotion,
}: PromoSlideItemProps) => {
  const content = (
    <>
      <img
        src={slide.imageUrl}
        alt={slide.imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {slide.overlayText && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(90deg,
                color-mix(in srgb, var(--accent-active) 75%, transparent) 0%,
                transparent 60%)`,
            }}
            aria-hidden="true"
          />
          <div
            className="relative z-10 mx-auto flex h-full flex-col justify-center px-5 sm:px-6 lg:px-10"
            style={{ maxWidth: 'var(--content-max-width)' }}
          >
            <p
              className="max-w-2xl uppercase"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(var(--text-3xl), 6vw, var(--text-5xl))',
                fontWeight: 'var(--font-bold)',
                lineHeight: 'var(--leading-tight)',
                letterSpacing: 'var(--tracking-display)',
                color: 'var(--accent-text)',
              }}
            >
              {slide.overlayText}
            </p>
            {slide.overlaySubtitle && (
              <p
                className="mt-3 max-w-xl"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                  lineHeight: 'var(--leading-relaxed)',
                  color: 'var(--announcement-text)',
                }}
              >
                {slide.overlaySubtitle}
              </p>
            )}
          </div>
        </>
      )}
    </>
  );

  // Las rutas internas (empiezan con '/') usan <Link> para navegación SPA sin
  // recarga; cualquier otra (http…) cae a un <a> normal.
  const isInternalLink = slide.linkTo?.startsWith('/') ?? false;

  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: isActive ? 1 : 0,
        transition: prefersReducedMotion ? 'none' : 'opacity 600ms ease',
        zIndex: isActive ? 1 : 0,
        backgroundColor: 'var(--accent)',
      }}
      aria-hidden={!isActive}
    >
      {slide.linkTo ? (
        isInternalLink ? (
          <Link
            to={slide.linkTo}
            className="relative block h-full w-full cursor-pointer"
            aria-label={slide.imageAlt}
          >
            {content}
          </Link>
        ) : (
          <a
            href={slide.linkTo}
            className="relative block h-full w-full cursor-pointer"
            aria-label={slide.imageAlt}
          >
            {content}
          </a>
        )
      ) : (
        <div className="relative h-full w-full">{content}</div>
      )}
    </div>
  );
};
