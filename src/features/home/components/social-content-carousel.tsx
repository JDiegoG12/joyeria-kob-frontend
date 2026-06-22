/**
 * @file social-content-carousel.tsx
 * @description Carrusel de videos sociales (Reels/TikTok/Facebook) para la home.
 *
 * Reemplaza el antiguo grid cuadrado por un carrusel horizontal de tarjetas
 * **verticales 9:16** (la relación real de Reels y TikTok), con asomo (“peek”)
 * de la siguiente tarjeta para invitar al swipe.
 *
 * ## Mecánica del carrusel
 * Reutiliza el patrón probado de `testimonials-carousel.tsx`:
 * - Track `flex overflow-x-auto` con `scroll-snap-type: x mandatory`; cada slide
 *   es `scroll-snap-align: start`. El scroll nativo conserva la inercia táctil
 *   de iOS/Android sin librerías extra.
 * - A diferencia del de testimonios (1 slide a la vez), aquí se ven varias
 *   tarjetas: ~1.3 en móvil, ~2.5 en tablet y ~4 en desktop.
 * - El `activeIndex`, los estados `canPrev/canNext` y si hay overflow se derivan
 *   de la posición de scroll (con un `step` = distancia entre dos slides,
 *   medida del DOM para incluir el gap). El handler de scroll se acota con
 *   `requestAnimationFrame`.
 * - Flechas prev/next (visibles en desktop) avanzan ~una página; los dots
 *   saltan a un slide concreto. Ambos respetan `prefers-reduced-motion`
 *   (scroll `auto` en lugar de `smooth`).
 *
 * ## Accesibilidad
 * - El track es `role="region"` con `aria-roledescription="carrusel"`.
 * - Cada tarjeta es un enlace con `aria-label` descriptivo y `alt` en la imagen.
 * - Los dots son `role="tab"` con `aria-current`; las flechas tienen `aria-label`.
 * - Si el contenido no desborda, controles y dots se ocultan (no aportan).
 *
 * @see social-content-section.tsx — obtiene los datos y monta este carrusel.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from '@/components/ui/social-icons';
import {
  buildUploadsSrcSet,
  SOCIAL_IMAGE_WIDTHS,
} from '@/shared/utils/image-srcset';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Plataformas soportadas para resolver ícono y etiqueta. */
export type SocialReelPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'youtube'
  | 'external';

/**
 * Reel ya normalizado y listo para pintar (sin acoplarse a la forma cruda del
 * backend). La sección resuelve la URL de imagen y la plataforma antes de pasar
 * los items al carrusel.
 */
export interface SocialReel {
  /** Identificador único. */
  id: number;
  /** Título mostrado sobre la imagen. */
  title: string;
  /** URL de destino (se abre en pestaña nueva). */
  link: string;
  /** Plataforma normalizada en minúsculas. */
  platform: SocialReelPlatform;
  /** URL absoluta de la miniatura, o cadena vacía si no hay. */
  thumbnailUrl: string;
}

// ─── Helper: ícono + etiqueta por plataforma ──────────────────────────────────

/**
 * Mapea la plataforma a su ícono compartido (`social-icons.tsx`) y su etiqueta
 * legible. Centraliza el switch para que tarjeta y badge usen lo mismo y evita
 * los SVG sociales duplicados que tenía la versión anterior.
 *
 * @param platform - Plataforma normalizada.
 * @returns Componente de ícono y etiqueta para mostrar.
 */
const platformVisual = (
  platform: SocialReelPlatform,
): { Icon: typeof InstagramIcon; label: string } => {
  switch (platform) {
    case 'instagram':
      return { Icon: InstagramIcon, label: 'Instagram' };
    case 'tiktok':
      return { Icon: TikTokIcon, label: 'TikTok' };
    case 'facebook':
      return { Icon: FacebookIcon, label: 'Facebook' };
    default:
      // youtube / external no tienen ícono propio en social-icons → genérico.
      return { Icon: ExternalLink as typeof InstagramIcon, label: 'Ver video' };
  }
};

// ─── Ícono play sólido ────────────────────────────────────────────────────────

/** Triángulo de “play” sólido (inline para nitidez y control de relleno). */
const PlayGlyph = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    style={{ marginLeft: size * 0.12 }} // compensa el “peso” visual a la izquierda
  >
    <path d="M5 3l14 9-14 9V3Z" />
  </svg>
);

// ─── Tarjeta reel ─────────────────────────────────────────────────────────────

interface SocialReelCardProps {
  reel: SocialReel;
  /** Si el usuario prefiere movimiento reducido (se omite el press animado). */
  reducedMotion: boolean;
}

/**
 * Tarjeta vertical 9:16 estilo Reel: imagen a sangre, badge de red social
 * arriba, botón play centrado y título sobre un degradado inferior (scrim) para
 * que se lea sobre cualquier imagen. Toda la tarjeta enlaza al video.
 *
 * Feedback de movimiento (coherente con el resto de la app):
 * - **Hover (desktop)**: lift + zoom de imagen + play/scrim intensificados (CSS).
 * - **Press (móvil/click)**: `scale 0.98` vía `whileTap` en un wrapper aparte
 *   (el lift vive en el `<a>`), para no pisar transformaciones.
 */
const SocialReelCard = ({ reel, reducedMotion }: SocialReelCardProps) => {
  const [imgError, setImgError] = useState(false);
  const { Icon, label } = platformVisual(reel.platform);
  const showImage = !imgError && reel.thumbnailUrl;

  return (
    <motion.div
      className="h-full"
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <a
        href={reel.link || '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver "${reel.title}" en ${label}`}
        className="group relative block h-full overflow-hidden shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[var(--shadow-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        style={{
          // Sin borde (look minimal): la imagen va a sangre y la elegancia la
          // dan la sombra suave en reposo y el lift + sombra-lg en hover.
          // Esquinas rectas, acorde a la estética del storefront.
          backgroundColor: 'var(--bg-tertiary)',
          textDecoration: 'none',
        }}
      >
        {/* ── Lienzo 9:16 ──────────────────────────────────────────────── */}
        <div className="relative aspect-9/16 w-full overflow-hidden">
          {showImage ? (
            <img
              src={reel.thumbnailUrl}
              srcSet={buildUploadsSrcSet(reel.thumbnailUrl, SOCIAL_IMAGE_WIDTHS)}
              sizes="(min-width: 1024px) 24vw, (min-width: 768px) 32vw, (min-width: 640px) 44vw, 72vw"
              alt={reel.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            // Fallback cuando no hay imagen o falla: ícono de la plataforma.
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ color: 'var(--text-muted)', opacity: 0.45 }}
            >
              <Icon size={44} aria-hidden="true" />
            </div>
          )}

          {/* Scrim: degradado inferior para legibilidad del título. Se
              intensifica levemente en hover para reforzar la profundidad. */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.30) 38%, rgba(0,0,0,0) 62%)',
            }}
            aria-hidden="true"
          />

          {/* Badge de red social — ícono compartido + etiqueta. */}
          <span
            className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              backgroundColor: 'rgba(0,0,0,0.55)',
              color: '#ffffff',
              backdropFilter: 'blur(4px)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            <Icon size={12} aria-hidden="true" />
            {label}
          </span>

          {/* Botón play centrado: oculto en reposo, se revela con fade + leve
              zoom al hacer hover (desktop). Decorativo: la tarjeta entera ya es
              el enlace. */}
          <span
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span
              className="flex scale-90 items-center justify-center rounded-full opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none"
              style={{
                width: 54,
                height: 54,
                backgroundColor: 'rgba(255,255,255,0.86)',
                color: 'var(--accent)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              }}
            >
              <PlayGlyph size={20} />
            </span>
          </span>

          {/* Título sobre el scrim, abajo. */}
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 sm:p-3.5">
            <span style={{ color: '#ffffff', opacity: 0.9, flexShrink: 0 }}>
              <Icon size={14} aria-hidden="true" />
            </span>
            <h3
              className="line-clamp-2"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
                lineHeight: 'var(--leading-snug)',
                color: '#ffffff',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {reel.title}
            </h3>
          </div>

          {/* Línea de acento que se revela en hover (refuerzo elegante sin
              redondear). Blanca para que lea sobre el scrim oscuro de la foto;
              el navy sería casi invisible sobre la imagen. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100 motion-reduce:transition-none"
            style={{ backgroundColor: 'var(--accent-text)' }}
            aria-hidden="true"
          />
        </div>
      </a>
    </motion.div>
  );
};

// ─── Carrusel ─────────────────────────────────────────────────────────────────

interface SocialContentCarouselProps {
  /** Reels normalizados a renderizar. */
  items: SocialReel[];
}

/**
 * Carrusel horizontal de tarjetas reel con swipe, flechas (desktop) y dots.
 * Pensado para mostrar varias tarjetas a la vez con asomo de la siguiente.
 */
export const SocialContentCarousel = ({
  items,
}: SocialContentCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  /** Si el track desborda; si no, ocultamos flechas y dots. */
  const [overflowing, setOverflowing] = useState(false);

  const shouldReduceMotion = useReducedMotion() ?? false;

  /**
   * `true` en móvil (`< sm`), donde las tarjetas se anclan al CENTRO. En ese
   * modo la posición de scroll y el índice activo se calculan centrando la
   * tarjeta en el viewport, no alineándola al borde izquierdo. Coincide con el
   * breakpoint del `scroll-snap-align` inyectado más abajo.
   */
  const isCenterMode = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 639px)').matches;

  /**
   * Distancia en px entre el inicio de dos slides consecutivos (ancho de la
   * tarjeta + gap). Se mide del DOM para no hardcodear el gap responsive.
   */
  const getStep = useCallback((): number => {
    const a = slideRefs.current[0];
    const b = slideRefs.current[1];
    if (a && b) return b.offsetLeft - a.offsetLeft;
    return a?.offsetWidth ?? 1;
  }, []);

  /** Recalcula `activeIndex`, `canPrev/canNext` y si hay overflow. */
  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    setOverflowing(maxScroll > 1);
    setCanPrev(track.scrollLeft > 1);
    setCanNext(track.scrollLeft < maxScroll - 1);

    let idx: number;
    if (isCenterMode()) {
      // Tarjeta cuyo centro queda más cerca del centro del viewport.
      const viewportCenter = track.scrollLeft + track.clientWidth / 2;
      idx = 0;
      let best = Infinity;
      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        const cardCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(cardCenter - viewportCenter);
        if (dist < best) {
          best = dist;
          idx = i;
        }
      });
    } else {
      const step = getStep();
      idx = Math.round(track.scrollLeft / step);
    }
    setActiveIndex(Math.max(0, Math.min(items.length - 1, idx)));
  }, [getStep, items.length]);

  /*
   * Suscripción al scroll del track (acotada con rAF) + recálculo en resize.
   * `sync()` inicial cubre el primer render para fijar overflow/flechas.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(sync);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sync);
    sync();

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  /** Avanza ~una página (ancho visible) en la dirección dada. */
  const scrollByPage = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: dir * track.clientWidth * 0.9,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  /**
   * Lleva el slide `idx` a su posición de reposo: centrado en móvil, alineado
   * al borde izquierdo desde `sm`. En móvil se mide la tarjeta del DOM para
   * centrarla con exactitud (las del medio quedan perfectamente centradas; la
   * primera y la última reposan en los extremos, como en cualquier carrusel).
   */
  const scrollToIndex = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = slideRefs.current[idx];
    const left =
      isCenterMode() && slide
        ? slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2
        : idx * getStep();
    track.scrollTo({
      left,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    // Gutters laterales en desktop (`md+`, donde aparecen las flechas): reservan
    // un espacio a cada lado para que las flechas vivan FUERA de las tarjetas y
    // nunca queden sobre un video. Así, al desaparecer en los extremos, debajo
    // queda el gutter vacío (no una carta) y no hay clics accidentales. En móvil
    // (`< md`) no hay padding ni flechas, el carrusel ocupa todo el ancho.
    <div className="relative md:px-14 lg:px-16">
      {/* Oculta la scrollbar del track y define el anclaje del snap por
          breakpoint: en móvil cada tarjeta se centra (asomo simétrico a ambos
          lados → la activa nunca queda pegada a un lado); desde `sm` se ancla
          al inicio para la fila multi-tarjeta de tablet/desktop. */}
      <style>{`
        [data-social-track]::-webkit-scrollbar { display: none; }
        [data-social-slide] {
          scroll-snap-align: center;
          /* Un swipe = una tarjeta: impide que la inercia salte varias de golpe. */
          scroll-snap-stop: always;
        }
        @media (min-width: 640px) {
          [data-social-slide] {
            scroll-snap-align: start;
            /* En desktop las flechas avanzan ~una página (varias tarjetas), así
               que no forzamos la parada en cada una. */
            scroll-snap-stop: normal;
          }
        }
      `}</style>

      {/* ── Track ──────────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        data-social-track
        role="region"
        aria-roledescription="carrusel"
        aria-label="Videos de Joyería KOB en redes sociales"
        className="flex gap-4 overflow-x-auto pb-2 sm:gap-5"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          scrollBehavior: shouldReduceMotion ? 'auto' : 'smooth',
          // Evita que el rebote horizontal “tire” del scroll vertical en iOS.
          overscrollBehaviorX: 'contain',
        }}
      >
        {items.map((reel, i) => (
          <div
            key={reel.id}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            data-social-slide
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`Video ${i + 1} de ${items.length}`}
            className="w-[84%] shrink-0 sm:w-[44%] md:w-[31.5%] lg:w-[23.5%]"
          >
            <SocialReelCard reel={reel} reducedMotion={shouldReduceMotion} />
          </div>
        ))}
      </div>

      {/* ── Flechas (desktop) — solo si hay overflow ─────────────────────── */}
      {overflowing && (
        <>
          <CarouselArrow
            direction="prev"
            disabled={!canPrev}
            onClick={() => scrollByPage(-1)}
          />
          <CarouselArrow
            direction="next"
            disabled={!canNext}
            onClick={() => scrollByPage(1)}
          />
        </>
      )}

      {/* ── Dots ─────────────────────────────────────────────────────────── */}
      {overflowing && (
        <div
          className="mt-7 flex items-center justify-center gap-2.5"
          role="tablist"
          aria-label="Seleccionar video"
        >
          {items.map((reel, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={reel.id}
                type="button"
                role="tab"
                onClick={() => scrollToIndex(i)}
                aria-label={`Ver video ${i + 1} de ${items.length}`}
                aria-current={isActive ? 'true' : undefined}
                aria-selected={isActive}
                className="cursor-pointer transition-all duration-300 ease-out"
                style={{
                  width: isActive ? '26px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: isActive
                    ? 'var(--accent-marker)'
                    : 'var(--border-strong)',
                  opacity: isActive ? 1 : 0.5,
                  border: 'none',
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Flecha de navegación ─────────────────────────────────────────────────────

interface CarouselArrowProps {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}

/**
 * Flecha lateral del carrusel. Oculta en móvil (la interacción ahí es swipe);
 * visible desde `md`.
 *
 * Diseño discreto y coherente con las flechas del carrusel hero: pastilla
 * **circular translúcida** con desenfoque, borde fino y chevron sutil. El color
 * del chevron usa `--accent-marker` (navy en claro → blanco en oscuro), así
 * lee sobre el fondo de la sección en ambos temas sin el bloque navy macizo
 * anterior. En los extremos se desvanece por completo (solo aparece cuando hay
 * a dónde avanzar), reforzando la limpieza visual.
 */
const CarouselArrow = ({ direction, disabled, onClick }: CarouselArrowProps) => {
  const isPrev = direction === 'prev';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-hidden={disabled}
      tabIndex={disabled ? -1 : 0}
      aria-label={isPrev ? 'Videos anteriores' : 'Siguientes videos'}
      className={`absolute top-[calc(50%-1.5rem)] z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-[opacity,background-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-default md:flex ${
        isPrev ? 'left-2 lg:left-3' : 'right-2 lg:right-3'
      }`}
      style={{
        backgroundColor:
          'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
        color: 'var(--accent-marker)',
        border:
          '1px solid color-mix(in srgb, var(--border-strong) 70%, transparent)',
        boxShadow: 'var(--shadow-sm)',
        // En los extremos desaparece (no hay a dónde ir): solo se ve cuando es
        // accionable, evitando un control "muerto" que ensucie la estética.
        opacity: disabled ? 0 : 1,
        pointerEvents: disabled ? 'none' : undefined,
      }}
    >
      {isPrev ? (
        <ChevronLeft size={18} strokeWidth={1.75} />
      ) : (
        <ChevronRight size={18} strokeWidth={1.75} />
      )}
    </button>
  );
};
