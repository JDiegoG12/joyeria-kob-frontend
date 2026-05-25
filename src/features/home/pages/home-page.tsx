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

import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import GOLD_INVESTMENT_IMAGE from '@/assets/GOLD_INVESTMENT_IMAGE.jpg';
import { SocialContentSection } from '../components/social-content-section';

/**
 * Slides promocionales del carrusel (slides 1+).
 * El slide 0 siempre es el banner principal configurable desde el admin.
 *
 * @remarks
 * Cuando el backend exponga el endpoint de slides promocionales,
 * reemplazar este arreglo estático por una llamada al servicio correspondiente.
 * Cada item representa una imagen de campaña o promoción temporal.
 */
const PROMO_SLIDES: PromoSlide[] = [
  {
    imageUrl:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=85',
    imageAlt: 'Colección de pulseras de oro Joyería KOB',
    overlayText: 'Nueva colección pulseras',
    linkTo: '/catalogo',
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1920&q=85',
    imageAlt: 'Anillos artesanales en oro 18k',
    overlayText: 'Anillos a tu medida',
    linkTo: '/catalogo',
  },
];

const SERVICES = [
  {
    icon: Paintbrush,
    title: 'Diseño',
    description:
      'Personalizamos piezas de orfebrería y construimos detalles que recuerdan momentos para siempre.',
  },
  {
    icon: Hammer,
    title: 'Elaboración',
    description:
      'Recreamos piezas de joyería a medida: medallas, anillos, pulseras y otros encargos especiales.',
  },
  {
    icon: Wrench,
    title: 'Reparación',
    description:
      'Contamos con taller especializado para reparar con cuidado las joyas que tienen valor sentimental.',
  },
  {
    icon: ShieldCheck,
    title: 'Mantenimiento',
    description:
      'Extendemos la vida de tus joyas con limpieza, ajuste y revisión técnica de cada pieza.',
  },
  {
    icon: MessageSquareText,
    title: 'Asesoría',
    description:
      'Te acompañamos en cada ocasión para elegir una pieza especial para alguien especial.',
  },
  {
    icon: Handshake,
    title: 'SÉ MAYORISTA',
    description:
      'Trabaja con nosotros para obtener mejores precios y condiciones especiales.',
  },
] as const;

const TESTIMONIALS = [
  {
    text: 'He comprado varias veces en Joyería KOB y siempre estoy impresionada por la calidad y la artesanía de sus joyas. Se nota el amor y la dedicación que ponen en cada pieza. Es reconfortante saber que estoy invirtiendo en joyas que durarán años.',
    name: 'Mercedes Villegas',
    location: 'Bogotá - Colombia',
  },
  {
    text: 'La originalidad de Joyería KOB es incomparable. Cada pieza es una obra de arte que destaca, los conozco hace más de 12 años y nunca me fallan. Si buscas joyería que exprese tu arte, Joyería KOB es el lugar para conseguirlo.',
    name: 'Ana Tobón',
    location: 'Bogotá - Colombia',
    featured: true,
  },
  {
    text: 'El equipo de Joyería KOB va más allá para asegurarse de que estés completamente satisfecho con tu compra. Siempre están disponibles para responder preguntas y ofrecer asesoramiento personalizado. Se nota que valoran a sus clientes.',
    name: 'Laura López',
    location: 'Medellín - Colombia',
  },
] as const;

/**
 * Página de inicio pública con orden editorial definido por mockups:
 * hero (carrusel), barra de navegación rápida, productos destacados,
 * inversión en oro, servicios y testimonios.
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
      {/* Hero como carrusel — slide 0 es el banner configurable desde admin */}
      <HeroCarousel promoSlides={PROMO_SLIDES} />

      {/*
       * Barra de navegación rápida al catálogo.
       * Solo se muestra en desktop (lg+): en móvil se reemplaza por el ítem
       * "Servicios" del menú hamburguesa, que es más usable sin hover.
       * El propio componente aplica `hidden lg:block` internamente.
       */}
      <CatalogNavBar />

      <FeaturedProductsSection />
      <GoldInvestmentSection />

      {/*
       * id="servicios" expuesto para que tanto el botón "SERVICIOS" de
       * `CatalogNavBar` (desktop) como el ítem "Servicios" del menú móvil
       * puedan hacer scroll suave hasta esta sección.
       */}
      <ServicesSection />

      <TestimonialsSection />

      <SocialContentSection />
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
  <section
    className="py-16 sm:py-20 lg:py-24"
    style={{ backgroundColor: 'var(--bg-primary)' }}
  >
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
          ¿Por qué invertir en oro?
        </h2>

        {/*
         * Bloque de párrafos: en móvil va centrado y centrado en su
         * contenedor (`mx-auto`); en desktop vuelve a alinearse a la
         * izquierda y se ancla al inicio de su columna.
         */}
        <div className="mt-8 max-w-md mx-auto text-center lg:mx-0 lg:text-left">
          <p>
            Invertir en oro es proteger tu capital con uno de los activos más
            sólidos y valorados del mundo.
          </p>
          <p className="mt-5">
            A lo largo del tiempo, el oro ha demostrado estabilidad frente a la
            inflación y la incertidumbre económica, convirtiéndose en una opción
            inteligente para quienes buscan seguridad, respaldo y crecimiento
            patrimonial.
          </p>
          <p className="mt-5">
            Más que una inversión, es tranquilidad para tu futuro.
          </p>
        </div>
      </RevealBlock>

      <RevealBlock delay={0.08}>
        <div
          className="aspect-[16/11] overflow-hidden shadow-[var(--shadow-sm)] transition-shadow duration-500 hover:shadow-[var(--shadow-md)]"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <img
            src={GOLD_INVESTMENT_IMAGE}
            alt="Detalle de joya de oro con piedras sobre fondo de marca"
            className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.025] motion-reduce:transition-none motion-reduce:hover:scale-100"
            loading="lazy"
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
 * · Mobile (<sm): 2 columnas con gap reducido para que la sección no se haga
 *   "eterna" en scroll. Las tarjetas tienen padding interno más compacto
 *   (ver `ServiceCard`) para caber cómodas en ~360px de ancho.
 * · sm (≥640px): 2 columnas con gap mayor.
 * · lg (≥1024px): 3 columnas con gap aún mayor (layout original desktop).
 *
 * El `pl-5` del grid mantiene el icono flotante de la primera columna sin
 * que se corte contra el borde izquierdo de la sección.
 *
 * @remarks
 * El `id="servicios"` permite el scroll suave desde `CatalogNavBar`
 * (desktop) y desde el ítem "Servicios" del menú móvil.
 */
const ServicesSection = () => (
  <section
    id="servicios"
    className="py-16 sm:py-20"
    style={{ backgroundColor: 'var(--bg-secondary)' }}
  >
    <div
      className="mx-auto px-5 sm:px-6 lg:px-10"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <SectionHeading title="Servicios" centered />

      <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 pl-5 sm:gap-x-12 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-14 lg:gap-y-16">
        {SERVICES.map((service, index) => (
          <RevealBlock key={service.title} delay={index * 0.04} className="h-full">
            <ServiceCard {...service} />
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
  <section
    className="py-16 sm:py-20 lg:py-24"
    style={{ backgroundColor: 'var(--bg-primary)' }}
  >
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
