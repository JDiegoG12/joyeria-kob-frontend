/**
 * @file home-page.tsx
 * @description Página principal pública de Joyería KOB.
 *
 * La home es independiente del catálogo: presenta marca, productos editoriales,
 * argumentos de valor, servicios y testimonios sin depender de stores o
 * servicios HTTP del catálogo.
 *
 * ## Sección hero
 * El hero es un carrusel (`HeroCarousel`) cuyo primer slide es el banner
 * principal configurable desde el panel admin (`/admin/general`).
 * Los slides promocionales (`PROMO_SLIDES`) son imágenes adicionales que
 * se configurarán desde el backend en una fase posterior.
 *
 * ## Barra de navegación rápida
 * `CatalogNavBar` se monta entre el hero y los productos destacados.
 * Permite acceder al catálogo, a una categoría raíz o a una subcategoría
 * directamente desde la home sin pasar por el sidebar del catálogo.
 *
 * ## Ancla de servicios
 * `ServicesSection` lleva `id="servicios"` para que el botón "SERVICIOS"
 * de `CatalogNavBar` pueda hacer scroll suave hasta ella.
 */

import { useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Hammer,
  MessageSquareText,
  Paintbrush,
  ShieldCheck,
  Handshake,
  Wrench,
} from 'lucide-react';
import { ServiceCard } from '@/features/home/components/service-card';
import { TestimonialCard } from '@/features/home/components/testimonial-card';
import { TestimonialsCarousel } from '@/features/home/components/testimonials-carousel';
import {
  HeroCarousel,
  type PromoSlide,
} from '@/features/home/components/hero-carousel';
import { CatalogNavBar } from '@/features/home/components/catalog-nav-bar';
import { FeaturedProductsSection } from '@/features/featured-products/components/featured-products-section';
import { buildWhatsAppUrl } from '@/config/contact';
import { SERVER_URL } from '@/api/server-url';
import { usePromoBannerStore } from '@/store/promo-banner.store';
import type { PromoBanner } from '@/features/promotions/types/promotion.types';
import GOLD_INVESTMENT_IMAGE_LG from '@/assets/gold-investment-lg.webp';
import GOLD_INVESTMENT_IMAGE_SM from '@/assets/gold-investment-sm.webp';
import { SocialContentSection } from '../components/social-content-section';
import { LocationSection } from '../components/location-section';
import { buildLocalBusinessJsonLd } from '@/config/structured-data';

/**
 * Construye la URL de destino de un banner de promoción según su tipo de enlace.
 * - PRODUCT  → deep-link al detalle del producto en el catálogo (`?product=`).
 * - CATEGORY → deep-link al catálogo filtrado por categoría (`?categoria=`).
 * - NONE     → sin enlace (banner informativo).
 */
/** JSON-LD del negocio local. Constante: no depende de props ni estado. */
const LOCAL_BUSINESS_JSON_LD = JSON.stringify(buildLocalBusinessJsonLd());

const buildPromoLinkTo = (banner: PromoBanner): string | undefined => {
  if (banner.linkType === 'PRODUCT' && banner.linkProductId) {
    return `/catalogo?product=${banner.linkProductId}`;
  }
  if (banner.linkType === 'CATEGORY' && banner.linkCategoryId != null) {
    return `/catalogo?categoria=${banner.linkCategoryId}`;
  }
  return undefined;
};

const SERVICES = [
  {
    icon: Paintbrush,
    title: 'Diseño',
    description:
      'Transformamos tus ideas y emociones en joyas de oro 18k personalizadas, diseñadas con dedicación, precisión y pasión.',
    message:
      'Hola, me interesa el servicio de Diseño de joyas personalizadas. ¿Podrían darme más información?',
  },
  {
    icon: Hammer,
    title: 'Fabricación',
    description:
      'Elaboramos las joyas desde cero a tu gusto, medida y con la mejor calidad.',
    message:
      'Hola, me interesa el servicio de Fabricación de una pieza a medida. ¿Podrían ayudarme?',
  },
  {
    icon: Wrench,
    title: 'Reparación',
    description:
      'Restauramos el valor sentimental de tus joyas brindandoles una nueva oportunidad para que te acompañen con la misma fuerza y elegancia.',
    message:
      'Hola, quisiera información sobre el servicio de Reparación de una joya.',
  },
  {
    icon: ShieldCheck,
    title: 'Mantenimiento',
    description:
      'Cuidamos, limpiamos y revisamos  tus joyas para que siempre luzcan y estén como nuevas.',
    message:
      'Hola, me interesa el servicio de Mantenimiento (limpieza y revisión) de mis joyas.',
  },
  {
    icon: MessageSquareText,
    title: 'Asesoría',
    description:
      'Te acompañamos durante todo el proceso para que escojas la joya perfeta.',
    message:
      'Hola, me gustaría recibir Asesoría para elegir una joya. ¿Podrían orientarme?',
  },
  {
    icon: Handshake,
    title: 'SÉ MAYORISTA',
    description:
      'Trabaja con nosotros para obtener mejores precios y condiciones especiales.',
    message:
      'Hola, estoy interesado en ser mayorista de Joyería KOB. ¿Podrían contarme las condiciones?',
  },
] as const;

const TESTIMONIALS = [
  {
    text: 'Compré un anillo muy bonito para mi esposa. ',
    name: 'Jose Muñoz',
    location: 'Mercaderes - Cauca',
  },
  {
    text: 'Mandé a personalizar una anillo con mi nombre y fecha de nacimiento y quedó muy elegante. Los recomiendo. ',
    name: 'Andrés Torres',
    location: 'Popayán - Cauca',
    featured: true,
  },
  {
    text: 'Buena atención, me enviaron fotos durante todo el proceso de fabricación, eso me gustó. ',
    name: 'Laura Meneses',
    location: 'Remolino - Nariño.',
  },
] as const;

/**
 * Página de inicio pública con orden editorial definido por mockups:
 * hero (carrusel), barra de navegación rápida, productos destacados,
 * servicios, inversión en oro, redes y testimonios.
 *
 * ─── Scroll a sección por navegación externa ─────────────────────────────────
 * Al llegar desde otra ruta con `location.state.scrollTo = '<id>'` (por
 * ejemplo, desde el ítem "Servicios" del menú móvil), el efecto detecta el
 * id, hace scroll suave a la sección compensando el offset de las barras
 * fijas y limpia el state para evitar re-scroll en navegaciones de back/forward.
 */
export const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Banners de promoción del carrusel (slides 1+), cargados desde el backend.
  const { banners, fetchBanners } = usePromoBannerStore();

  useEffect(() => {
    void fetchBanners();
  }, [fetchBanners]);

  const promoSlides: PromoSlide[] = useMemo(
    () =>
      banners.map((banner) => ({
        imageUrl: `${SERVER_URL}${banner.imageUrl}`,
        imageAlt: banner.title ?? 'Promoción de Joyería KOB',
        overlayText: banner.title ?? undefined,
        overlaySubtitle: banner.subtitle ?? undefined,
        linkTo: buildPromoLinkTo(banner),
      })),
    [banners],
  );

  /*
   * Scroll diferido a una sección de la home al llegar desde otra ruta.
   *
   * Se espera un pequeño tick (60ms) para que React termine de pintar todas
   * las secciones antes de medir su posición; sin ese delay, el scroll puede
   * caer "corto" porque la imagen de oro o las tarjetas aún no han
   * reservado su altura final.
   *
   * Tras el scroll se limpia `location.state` con `replace: true` para que
   * un back/forward no vuelva a disparar el efecto.
   */
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(target);
      if (!el) return;

      const style = getComputedStyle(document.documentElement);
      const announcementPx =
        parseFloat(style.getPropertyValue('--announcement-height')) || 36;
      const navbarPx =
        parseFloat(style.getPropertyValue('--navbar-height')) || 64;
      const offset = announcementPx + navbarPx + 16;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });

      // Limpia el state para que back/forward no vuelva a disparar el scroll.
      navigate(location.pathname, { replace: true, state: null });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [location, navigate]);

  return (
    <div className="overflow-x-hidden">
      <Helmet>
        <title>Joyería KOB | Joyas de oro 18k personalizadas en El Bordo</title>
        <meta
          name="description"
          content="Diseñamos y fabricamos joyas de oro 18k a la medida: anillos, collares, dijes y pulseras personalizadas. Pide tu diseño único en Joyería KOB."
        />
        {/*
         * El banner del hero (candidato a LCP) vive en el backend de archivos
         * (`SERVER_URL`), de dominio distinto. Su URL no se conoce hasta el
         * fetch de `/api/banner`, así que no se puede precargar; pero sí
         * calentamos la conexión (DNS + TCP + TLS) para que, en cuanto el fetch
         * resuelva, la descarga de la imagen empiece sin ese coste. Acelera el
         * LCP móvil sin precargar bytes que quizá no se usen.
         */}
        {SERVER_URL && <link rel="preconnect" href={SERVER_URL} />}
        {SERVER_URL && <link rel="dns-prefetch" href={SERVER_URL} />}

        {/*
         * JSON-LD del negocio local (JewelryStore): dirección, geo, teléfono y
         * horarios. Pieza SEO clave para búsquedas locales y Google Maps; se
         * declara aquí porque la sección "Visítanos" vive en la home.
         * PENDIENTE: espejar en el backend (json-ld.ts) para el HTML de bots.
         */}
        <script type="application/ld+json">{LOCAL_BUSINESS_JSON_LD}</script>
      </Helmet>

      {/* Hero como carrusel — slide 0 es el banner configurable desde admin */}
      <HeroCarousel promoSlides={promoSlides} />

      {/*
       * Barra de navegación rápida al catálogo.
       * Solo se muestra en desktop (lg+): en móvil se reemplaza por el ítem
       * "Servicios" del menú hamburguesa, que es más usable sin hover.
       * El propio componente aplica `hidden lg:block` internamente.
       */}
      <CatalogNavBar />

      <FeaturedProductsSection />

      {/*
       * id="servicios" expuesto para que tanto el botón "SERVICIOS" de
       * `CatalogNavBar` (desktop) como el ítem "Servicios" del menú móvil
       * puedan hacer scroll suave hasta esta sección. Va en segunda posición
       * (antes de "Invierte en Oro") por decisión editorial del cliente.
       */}
      <ServicesSection />

      <GoldInvestmentSection />

      <SocialContentSection />

      <TestimonialsSection />

      {/*
       * Cierre de la home: ubicación física, horarios y contacto. Fondo
       * `bg-grain` (alterna con el `bg-silk` de Testimonios) y `id="ubicacion"`
       * por si se enlaza con scroll suave desde la navegación.
       */}
      <LocationSection />
    </div>
  );
};

/**
 * Sección editorial que explica el valor del oro como inversión.
 *
 * ─── Layout ──────────────────────────────────────────────────────────────────
 * · Mobile (<lg): una sola columna. Texto primero (centrado para mayor
 *   impacto editorial y mejor jerarquía en pantallas estrechas), imagen
 *   debajo full-width.
 * · Desktop (lg+): dos columnas (texto izquierda, imagen derecha) con la
 *   alineación a la izquierda original.
 *
 * El título evita `<br>` forzados: en su lugar deja que el `clamp()` del
 * tamaño y el ancho de columna controlen el wrap de forma natural,
 * lo que produce mejores quiebres en cualquier viewport.
 */
const GoldInvestmentSection = () => (
  <section className="bg-silk py-16 sm:py-20 lg:py-24">
    <div
      className="mx-auto grid items-center gap-10 px-5 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16 lg:px-10"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <RevealBlock>
        {/*
         * Título: centrado en móvil, izquierda en desktop.
         * Sin <br> forzados — se confía en `clamp()` y el ancho de columna
         * para definir los quiebres de línea de manera natural.
         */}
        <h2
          className="text-center uppercase lg:text-left"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(var(--text-3xl), 7vw, var(--text-5xl))',
            fontWeight: 'var(--font-bold)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-display)',
            color: 'var(--text-accent)',
          }}
        >
          Invierte en Oro, Invierte en Seguridad
        </h2>

        {/*
         * Bloque de párrafos: en móvil va centrado y centrado en su
         * contenedor (`mx-auto`); en desktop vuelve a alinearse a la
         * izquierda y se ancla al inicio de su columna.
         */}
        <div className="mt-8 max-w-md mx-auto text-center lg:mx-0 lg:text-left">
          <p>
            El oro ha sido durante siglos uno de los activos más seguros y valorados del mundo. La capacidad para mantener su valor frente a la inflación y los cambios económicos lo convierte en una alternativa confiable para quienes buscan proteger y fortalecer su patrimonio.
          </p>
          <p className="mt-5">
            Cada pieza de oro representa elegancia, exclusividad y, al mismo tiempo, una inversión tangible que puedes disfrutar hoy mientras construyes valor para mañana.
          </p>
        </div>
      </RevealBlock>

      <RevealBlock delay={0.08}>
        <div
          className="aspect-[16/11] overflow-hidden shadow-[var(--shadow-sm)] transition-shadow duration-500 hover:shadow-[var(--shadow-md)]"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <img
            src={GOLD_INVESTMENT_IMAGE_LG}
            srcSet={`${GOLD_INVESTMENT_IMAGE_SM} 640w, ${GOLD_INVESTMENT_IMAGE_LG} 1067w`}
            sizes="(min-width: 1024px) 680px, 100vw"
            alt="Detalle de joya de oro con piedras sobre fondo de marca"
            className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.025] motion-reduce:transition-none motion-reduce:hover:scale-100"
            loading="lazy"
            decoding="async"
          />
        </div>
      </RevealBlock>
    </div>
  </section>
);

/**
 * Servicios de taller y asesoría replicados como tarjetas reutilizables.
 *
 * ─── Layout responsive ───────────────────────────────────────────────────────
 * · Mobile (<sm): 1 columna de tarjetas horizontales (ícono + texto en fila)
 *   para que cada servicio se lea de un vistazo sin acumular altura. El
 *   `ServiceCard` cambia su flujo interno a `flex-row` en este breakpoint.
 * · sm (≥640px): 2 columnas con tarjetas verticales y el ícono flotante
 *   característico del diseño original.
 * · lg (≥1024px): 3 columnas con gap aún mayor (layout original desktop).
 *
 * El `sm:pl-5` mantiene el ícono flotante de la primera columna sin que se
 * corte contra el borde izquierdo de la sección. En móvil el ícono va
 * inline dentro de la tarjeta y no necesita ese padding extra.
 *
 * @remarks
 * El `id="servicios"` permite el scroll suave desde `CatalogNavBar`
 * (desktop) y desde el ítem "Servicios" del menú móvil.
 */
const ServicesSection = () => (
  <section id="servicios" className="bg-grain py-16 sm:py-20">
    <div
      className="mx-auto px-5 sm:px-6 lg:px-10"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <SectionHeading title="Servicios" centered />

      <div className="mt-10 grid grid-cols-1 gap-y-3 sm:mt-12 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-14 sm:pl-5 lg:grid-cols-3 lg:gap-x-14 lg:gap-y-16">
        {SERVICES.map((service, index) => (
          <RevealBlock key={service.title} delay={index * 0.04} className="h-full">
            <ServiceCard
              icon={service.icon}
              title={service.title}
              description={service.description}
              href={buildWhatsAppUrl(service.message)}
            />
          </RevealBlock>
        ))}
      </div>
    </div>
  </section>
);

/**
 * Testimonios de clientes con énfasis en la tarjeta central del mockup.
 *
 * ─── Layout responsive ───────────────────────────────────────────────────────
 * · Mobile/Tablet (<md): carrusel horizontal con swipe nativo + dots.
 *   Mantiene la sección compacta y sustituye un scroll vertical largo por
 *   una interacción táctil más natural en pantallas pequeñas.
 * · Desktop (md+):       grid 1×3 idéntico al original, los tres testimonios
 *   visibles a la vez para lectura comparativa.
 *
 * Ambas variantes usan los mismos datos (`TESTIMONIALS`) y comparten el
 * componente `TestimonialCard`, evitando divergencias de contenido.
 */
const TestimonialsSection = () => (
  <section className="bg-silk py-16 sm:py-20 lg:py-24">
    <div
      className="mx-auto px-5 sm:px-6 lg:px-10"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <SectionHeading title="Testimonios" centered />

      {/* ── Variante móvil/tablet: carrusel ──────────────────────────────── */}
      <div className="mt-10 md:hidden">
        <RevealBlock>
          <TestimonialsCarousel testimonials={TESTIMONIALS} />
        </RevealBlock>
      </div>

      {/* ── Variante desktop: grid 1×3 (layout original) ─────────────────── */}
      <div className="mt-10 hidden gap-6 md:grid md:grid-cols-3 md:items-stretch">
        {TESTIMONIALS.map((testimonial, index) => (
          <RevealBlock key={testimonial.name} delay={index * 0.06}>
            <TestimonialCard {...testimonial} />
          </RevealBlock>
        ))}
      </div>
    </div>
  </section>
);

interface SectionHeadingProps {
  /** Título visible de sección. */
  title: string;
  /** Centra el texto y muestra línea ornamental inferior. */
  centered?: boolean;
}

/** Título de sección consistente con la estética editorial del mockup. */
const SectionHeading = ({ title, centered = false }: SectionHeadingProps) => (
  <div className={centered ? 'text-center' : undefined}>
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
    {centered && (
      <span
        className="mx-auto mt-3 block h-px w-48 max-w-[44vw]"
        style={{ backgroundColor: 'var(--border-strong)' }}
        aria-hidden="true"
      />
    )}
  </div>
);

interface RevealBlockProps {
  /** Contenido que entra suavemente al viewport. */
  children: ReactNode;
  /** Clases opcionales para conservar layout externo. */
  className?: string;
  /** Retardo corto para crear ritmo entre elementos hermanos. */
  delay?: number;
}

/**
 * Entrada sutil al hacer scroll.
 *
 * Respeta `prefers-reduced-motion` y no altera el layout cuando las animaciones
 * están desactivadas.
 */
const RevealBlock = ({ children, className, delay = 0 }: RevealBlockProps) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
};
