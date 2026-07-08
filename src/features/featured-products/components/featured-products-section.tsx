/**
 * @file featured-products-section.tsx
 * @description Sección de "Productos destacados" que se renderiza en la home
 * pública de Joyería KOB.
 *
 * ## Responsabilidad
 * - Solicitar los destacados al backend a través de `useFeaturedProductStore`.
 * - Renderizar la grilla de `FeaturedProductCard` ya cargados.
 * - Mostrar un skeleton mientras carga y ocultarse por completo si no hay datos.
 *
 * ## Visibilidad de la sección
 * - **0 destacados** → la sección NO se renderiza (devuelve `null`).
 * - **1 a 6 destacados** → se muestran los que haya.
 * - El admin nunca verá un placeholder en la home; los slots vacíos solo
 *   existen en el panel admin para invitar a completar los 6.
 *
 * ## Grid responsive
 * - **Móvil / Tablet (sm)**: 2 columnas (`grid-cols-2`) dentro de `max-w-2xl`.
 * - **Desktop (lg)**: 3 columnas — 6 destacados forman 2 filas perfectas.
 *
 * ## Dimensión de tarjetas en desktop
 * El título usa el `--content-max-width` general (1280 px) pero la grilla se
 * constriñe deliberadamente para reducir el tamaño de cada tarjeta:
 * `lg:max-w-148` (37 rem ≈ 592 px) deja tarjetas de ~184 px de ancho, y solo
 * en monitores grandes (`2xl`, ≥1536 px) crece a `max-w-170` (42.5 rem ≈ 680 px).
 *
 * El motivo es que en laptops de poco alto (p. ej. 1366×768 — que en Tailwind
 * caen en el breakpoint `xl`, ≥1280 px) una tarjeta cuadrada de ~325 px no
 * dejaba ver ni una fila completa por encima del pliegue. Al estrechar la
 * grilla, la imagen cuadrada baja en alto y entra al menos una fila íntegra.
 *
 * ## Animaciones
 * Cada tarjeta entra con un fade-in/translate Y mediante `RevealBlock`
 * (idéntico patrón al usado en otras secciones de `home-page.tsx`).
 * Respeta `prefers-reduced-motion`.
 *
 * @see featured-product-card.tsx — tarjeta individual renderizada por la grilla.
 * @see featured-product.store.ts — fuente de datos de la sección.
 */

import { useEffect, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useFeaturedProductStore } from '@/store/featured-product.store';
import { FeaturedProductCard } from './featured-product-card';

// ─── Subcomponentes auxiliares ────────────────────────────────────────────────

interface RevealBlockProps {
  /** Contenido que aparece progresivamente al entrar al viewport. */
  children: ReactNode;
  /** Retardo de la animación, en segundos. */
  delay?: number;
}

/**
 * Wrapper de entrada suave al hacer scroll.
 * Replica el comportamiento del `RevealBlock` interno de `home-page.tsx`
 * para mantener un ritmo visual coherente con las demás secciones de la home.
 *
 * @internal
 */
const RevealBlock = ({ children, delay = 0 }: RevealBlockProps) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Título centrado con línea ornamental — mismo estilo de la home.
 *
 * Replica `SectionHeading` de `home-page.tsx` para que la sección sea
 * autocontenida y no dependa de un import circular.
 *
 * @internal
 */
const SectionHeading = ({ title }: { title: string }) => (
  <div className="text-center">
    <h2
      className="uppercase"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(var(--text-2xl), 5vw, var(--text-4xl))',
        fontWeight: 'var(--font-bold)',
        lineHeight: 'var(--leading-tight)',
        letterSpacing: 'var(--tracking-display)',
        color: 'var(--text-accent)',
      }}
    >
      {title}
    </h2>
    <span
      className="mx-auto mt-3 block h-px w-48 max-w-[44vw]"
      style={{ backgroundColor: 'var(--border-strong)' }}
      aria-hidden="true"
    />
  </div>
);

/**
 * Skeleton de carga con 6 tarjetas vacías. Aplica el mismo grid responsive
 * que el contenido real para evitar saltos de layout.
 *
 * @internal
 */
const SkeletonGrid = () => (
  <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:gap-5 lg:max-w-148 lg:grid-cols-3 lg:gap-5 2xl:max-w-170">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="animate-pulse"
        style={{
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          animationDelay: `${index * 80}ms`,
        }}
      >
        <div
          className="aspect-square w-full"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
        <div
          className="h-px w-full"
          style={{ backgroundColor: 'var(--border-color)' }}
        />
        <div className="px-2.5 pb-3 pt-2.5 text-center sm:px-3 sm:pb-4 sm:pt-3">
          <div
            className="mx-auto h-3 w-3/4 rounded"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
          <div
            className="mx-auto mt-2 h-2.5 w-1/3 rounded"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
          <div
            className="mx-auto mt-2 h-3 w-1/2 rounded"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />
        </div>
      </div>
    ))}
  </div>
);

// ─── Sección principal ────────────────────────────────────────────────────────

/**
 * Sección "Productos destacados" para la página de inicio.
 *
 * Carga los destacados al montar, muestra un skeleton mientras llega la
 * respuesta y se oculta por completo si no hay datos para mostrar. El contenido
 * real se renderiza en una grilla de 2 columnas en móvil y 3 en desktop.
 */
export const FeaturedProductsSection = () => {
  const { items, isFetching, fetchFeatured } = useFeaturedProductStore();
  const shouldReduceMotion = useReducedMotion();

  // Carga inicial al montar — el store evita peticiones duplicadas internamente.
  useEffect(() => {
    void fetchFeatured();
  }, [fetchFeatured]);

  // Si terminó de cargar y no hay destacados, ocultar la sección por completo.
  // Esto evita renderizar un título suelto sin contenido debajo.
  if (!isFetching && items.length === 0) {
    return null;
  }

  return (
    <section className="bg-silk py-12 sm:py-14 lg:py-16">
      <div
        className="mx-auto px-5 sm:px-6 lg:px-10"
        style={{ maxWidth: 'var(--content-max-width)' }}
      >
        <SectionHeading title="Productos destacados" />

        {isFetching ? (
          <SkeletonGrid />
        ) : (
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:gap-5 lg:max-w-148 lg:grid-cols-3 lg:gap-5 2xl:max-w-170">
            {items.map((featured, index) => (
              <RevealBlock
                key={featured.id}
                delay={Math.min(index * 0.05, 0.25)}
              >
                {/*
                 * Feedback de "press" idéntico al del catálogo: hundimiento
                 * sutil (scale 0.98) al hacer click o mantener el dedo. `whileTap`
                 * se activa en pointer/touch-down y se libera al soltar, así que
                 * cubre el caso móvil de mantener presionado. El lift de hover
                 * vive en el <article> (CSS) → sin conflicto de transforms.
                 */}
                <motion.div
                  className="h-full"
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <FeaturedProductCard product={featured.product} />
                </motion.div>
              </RevealBlock>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};