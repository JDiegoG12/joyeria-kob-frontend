/**
 * @file testimonials-carousel.tsx
 * @description Carrusel de testimonios para la vista móvil de la home.
 *
 * ─── Por qué un carrusel solo en móvil ──────────────────────────────────────
 * En desktop los tres testimonios caben holgados en un grid 1×3 que el
 * usuario lee de un vistazo. En móvil ese mismo contenido apilado verticalmente
 * obliga a un scroll largo y rompe el ritmo editorial. El carrusel resuelve
 * ambos problemas: muestra una tarjeta a la vez, ocupa una altura constante
 * y entrega una interacción táctil natural (swipe horizontal).
 *
 * ─── Implementación ─────────────────────────────────────────────────────────
 * · Track: `flex overflow-x-auto` con `scroll-snap-type: x mandatory`.
 *   Cada slide es `min-w-full snap-center snap-always` para que el snap
 *   centre la tarjeta activa sin posiciones intermedias.
 * · Scroll nativo del navegador: respeta inercia táctil de iOS/Android sin
 *   librerías adicionales y conserva accesibilidad por defecto.
 * · Sin auto-play: los testimonios suelen ser textos largos; mover la
 *   tarjeta sin permiso interrumpe la lectura. El usuario controla.
 * · Scrollbar oculta vía CSS inyectado (`::-webkit-scrollbar`) + `scrollbar-width: none`.
 *
 * ─── Sincronización dots ↔ scroll ──────────────────────────────────────────
 * Un `IntersectionObserver` con el propio track como `root` observa cada
 * slide. Cuando un slide pasa el umbral del 60% de visibilidad, se actualiza
 * `activeIndex`. Esto mantiene los dots en sintonía tanto con el swipe como
 * con clicks en otro dot.
 *
 * Al hacer click en un dot, se calcula `left = idx * track.clientWidth` y
 * se hace `track.scrollTo({ left })` — más fiable que `scrollIntoView`,
 * que puede arrastrar la página completa al ajustar verticalmente.
 *
 * ─── Accesibilidad ──────────────────────────────────────────────────────────
 * · El track expone `role="region"` con `aria-roledescription="carrusel"`.
 * · Cada slide es un `group` con `aria-label="Testimonio i de N"`.
 * · Los dots son `<button>` con `aria-current` en el activo y `aria-label`
 *   descriptivo.
 * · Respeta `prefers-reduced-motion`: el scroll se vuelve `auto` (sin
 *   animación) tanto en swipe programático como en transiciones de dots.
 */

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { TestimonialCard } from '@/features/home/components/testimonial-card';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Testimonial {
  /** Texto del testimonio publicado por el cliente. */
  text: string;
  /** Nombre público del cliente. */
  name: string;
  /** Ciudad o país asociados al testimonio. */
  location: string;
  /** Si la tarjeta debe destacarse visualmente (no afecta el carrusel). */
  featured?: boolean;
}

interface TestimonialsCarouselProps {
  /** Lista de testimonios a renderizar como slides. */
  testimonials: ReadonlyArray<Testimonial>;
}

// ─── Componente principal ───────────────────────────────────────────────────

/**
 * Carrusel de testimonios con swipe horizontal + dots indicadores.
 *
 * Pensado para móvil/tablet. En desktop conviene seguir usando un grid de
 * tres columnas (la home lo gestiona con `lg:grid` + `lg:hidden` sobre este
 * componente) para que los tres testimonios sean visibles a la vez.
 */
export const TestimonialsCarousel = ({
  testimonials,
}: TestimonialsCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Start on the featured testimonial (index 1 — Ana Tobón).
  const [activeIndex, setActiveIndex] = useState(1);
  const shouldReduceMotion = useReducedMotion();

  /*
   * Scroll inicial al testimonio destacado (índice 1) sin animación.
   *
   * Se difiere un tick (setTimeout 0) para que el track ya tenga su ancho
   * final tras el primer paint, evitando un desplazamiento corto si el
   * layout aún no se ha estabilizado.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const timer = window.setTimeout(() => {
      track.scrollTo({ left: track.clientWidth, behavior: 'auto' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /*
   * IntersectionObserver: mantiene `activeIndex` sincronizado con el slide
   * actualmente centrado, sin importar si el cambio se origina por swipe,
   * por click en un dot o por inercia residual del scroll.
   *
   * Threshold 0.6 — el slide pasa a "activo" cuando >60% es visible.
   * Esto evita parpadeos cuando dos slides están momentáneamente al 50%
   * durante una transición.
   *
   * Se reinicia el observer si cambia el número de testimonios para que
   * los refs apunten siempre a los nodos vigentes.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.index ?? '0',
            );
            setActiveIndex(idx);
          }
        });
      },
      { root: track, threshold: [0.6, 0.75, 0.9] },
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [testimonials.length]);

  /**
   * Mueve el track al slide `idx` con desplazamiento horizontal nativo.
   *
   * Se prefiere `track.scrollTo` sobre `el.scrollIntoView({ inline: 'center' })`
   * porque este último puede arrastrar la página completa cuando la sección
   * no está perfectamente centrada en el viewport vertical. Calcular el
   * offset manualmente nos da control absoluto sobre el eje X del track.
   *
   * @param idx - Índice del slide destino.
   */
  const scrollToSlide = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: idx * track.clientWidth,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="relative">
      {/*
       * Estilos inyectados para ocultar la scrollbar horizontal del track
       * sin perder la funcionalidad de scroll. Se usa un selector por
       * data-attribute para no afectar a otros scrollers de la página.
       */}
      <style>{`
        [data-testimonials-track]::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Track de slides ──────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        data-testimonials-track
        role="region"
        aria-roledescription="carrusel"
        aria-label="Testimonios de clientes"
        className="flex overflow-x-auto"
        style={{
          /*
           * `scrollbarWidth` para Firefox y `msOverflowStyle` para IE/old Edge
           * complementan el `::-webkit-scrollbar` del bloque <style>.
           * `scrollSnapType` y `scrollBehavior` orquestan el snap fluido.
           */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          scrollBehavior: shouldReduceMotion ? 'auto' : 'smooth',
          // overscroll-behavior evita que el rebote del carrusel "tire" del
          // scroll vertical de la página en iOS al llegar al primer/último slide.
          overscrollBehaviorX: 'contain',
        }}
      >
        {testimonials.map((testimonial, i) => (
          <div
            key={testimonial.name}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            data-index={i}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`Testimonio ${i + 1} de ${testimonials.length}`}
            className="min-w-full px-2"
            style={{
              scrollSnapAlign: 'center',
              scrollSnapStop: 'always',
            }}
          >
            <TestimonialCard {...testimonial} />
          </div>
        ))}
      </div>

      {/* ── Dots indicadores ─────────────────────────────────────────────── */}
      {/*
       * El dot activo se ensancha (efecto "pill"): refuerzo visual sin
       * recurrir a colores muy distintos, manteniendo la estética sobria.
       * La transición de width + backgroundColor se hace en el mismo
       * `transition-all` para que el cambio sea fluido.
       */}
      <div
        className="mt-7 flex items-center justify-center gap-2.5"
        role="tablist"
        aria-label="Seleccionar testimonio"
      >
        {testimonials.map((testimonial, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={testimonial.name}
              type="button"
              role="tab"
              onClick={() => scrollToSlide(i)}
              aria-label={`Ver testimonio ${i + 1} de ${testimonials.length}`}
              aria-current={isActive ? 'true' : undefined}
              aria-selected={isActive}
              className="cursor-pointer transition-all duration-300 ease-out"
              style={{
                width: isActive ? '26px' : '8px',
                height: '8px',
                borderRadius: '999px',
                backgroundColor: isActive
                  ? 'var(--accent)'
                  : 'var(--border-strong)',
                opacity: isActive ? 1 : 0.5,
                border: 'none',
                padding: 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
