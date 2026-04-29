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
 * - Responsive: altura fija en desktop (800px), dinámica en mobile (min 560px).
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

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHeroBannerStore } from '@/store/hero-banner.store';

/** Imagen hero estática por defecto cuando no hay imagen configurada. */
const DEFAULT_HERO_IMAGE = 'src/assets/HERO_IMAGE.jpg';

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
  const { bannerText, bannerSubtitle, bannerImageUrl } = useHeroBannerStore();

  const totalSlides = 1 + promoSlides.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const heroImage = bannerImageUrl ?? DEFAULT_HERO_IMAGE;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        height: 'clamp(560px, 800px, 100vh)',
        backgroundColor: 'var(--accent)',
      }}
      aria-label="Carrusel de banner principal"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Pista de slides ─────────────────────────────────────────────── */}
      <div className="relative h-full w-full">
        {/* Slide 0: Banner principal configurable */}
        <MainBannerSlide
          imageUrl={heroImage}
          bannerText={bannerText}
          bannerSubtitle={bannerSubtitle}
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
          {/* Flecha izquierda */}
          <button
            type="button"
            onClick={() => handleManualNav(goToPrev)}
            className="absolute top-1/2 left-4 z-20 flex -translate-y-1/2 items-center justify-center transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 sm:left-6"
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

          {/* Flecha derecha */}
          <button
            type="button"
            onClick={() => handleManualNav(goToNext)}
            className="absolute top-1/2 right-4 z-20 flex -translate-y-1/2 items-center justify-center transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 sm:right-6"
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
                  outline: 'none',
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

// ─── Slide 0: Banner principal ─────────────────────────────────────────────────

interface MainBannerSlideProps {
  imageUrl: string;
  bannerText: string;
  bannerSubtitle: string;
  isActive: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Slide principal del carrusel con texto configurable y CTAs fijos.
 * Ocupa el 100% del área del carrusel y siempre es el slide 0.
 */
const MainBannerSlide = ({
  imageUrl,
  bannerText,
  bannerSubtitle,
  isActive,
  prefersReducedMotion,
}: MainBannerSlideProps) => (
  <div
    className="absolute inset-0"
    style={{
      opacity: isActive ? 1 : 0,
      transition: prefersReducedMotion ? 'none' : 'opacity 600ms ease',
      zIndex: isActive ? 1 : 0,
    }}
    aria-hidden={!isActive}
  >
    {/* Imagen de fondo */}
    <img
      src={imageUrl}
      alt="Banner principal de Joyería KOB"
      className="absolute inset-0 h-full w-full object-cover"
    />

    {/* Overlay degradado para legibilidad del texto */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(90deg,
            color-mix(in srgb, var(--accent-active) 88%, transparent) 0%,
            color-mix(in srgb, var(--accent-active) 58%, transparent) 46%,
            transparent 100%
          ),
          linear-gradient(0deg,
            color-mix(in srgb, var(--accent-active) 76%, transparent) 0%,
            transparent 42%
          )`,
      }}
      aria-hidden="true"
    />

    {/* Contenido de texto y CTAs */}
    <div
      className="relative z-10 mx-auto flex h-full items-end px-5 pb-14 pt-20 sm:px-6 lg:px-10"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <div className="max-w-3xl">
        {/* Eyebrow */}
        <p
          className="mb-4 uppercase"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-widest)',
            color: 'var(--announcement-text)',
          }}
        >
          Oro 18k · joyería hecha a medida
        </p>

        {/* Título principal (configurable) */}
        <h1
          className="text-[2.7rem] sm:text-[var(--text-4xl)] lg:text-[var(--text-5xl)]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--font-bold)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-display)',
            color: 'var(--accent-text)',
          }}
        >
          {bannerText}
        </h1>

        {/* Subtítulo (configurable) */}
        <p
          className="mt-5 max-w-2xl"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            lineHeight: 'var(--leading-relaxed)',
            color: 'var(--announcement-text)',
          }}
        >
          {bannerSubtitle}
        </p>

        {/* CTAs fijos */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/catalogo"
            className="inline-flex cursor-pointer items-center justify-center gap-2 px-5 py-3 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
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
          <a
            href="https://wa.me/573135007459"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center justify-center gap-2 border px-5 py-3 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
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
          </a>
        </div>
      </div>
    </div>
  </div>
);

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
            className="relative z-10 mx-auto flex h-full items-center px-5 sm:px-6 lg:px-10"
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
          </div>
        </>
      )}
    </>
  );

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
        <a
          href={slide.linkTo}
          className="relative block h-full w-full cursor-pointer"
          aria-label={slide.imageAlt}
        >
          {content}
        </a>
      ) : (
        <div className="relative h-full w-full">{content}</div>
      )}
    </div>
  );
};
