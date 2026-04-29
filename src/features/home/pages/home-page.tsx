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
 */

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Hammer,
  HeartHandshake,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { ServiceCard } from '@/features/home/components/service-card';
import { TestimonialCard } from '@/features/home/components/testimonial-card';
import {
  HeroCarousel,
  type PromoSlide,
} from '@/features/home/components/hero-carousel';

const GOLD_INVESTMENT_IMAGE = 'src/assets/GOLD_INVESTMENT_IMAGE.jpg';

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

const FEATURED_GROUPS = [
  {
    title: 'Anillos',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85',
        alt: 'Anillo dorado con detalle artesanal',
      },
      {
        src: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&q=85',
        alt: 'Anillo de oro sobre superficie oscura',
      },
    ],
  },
  {
    title: 'Cadenas',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85',
        alt: 'Cadena dorada con dije',
      },
      {
        src: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=900&q=85',
        alt: 'Dijes dorados con textura fina',
      },
    ],
  },
  {
    title: 'Pulseras',
    images: [
      {
        src: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=85',
        alt: 'Pulsera dorada con brillo',
      },
      {
        src: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
        alt: 'Pulseras finas de joyería',
      },
    ],
  },
] as const;

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
    icon: HeartHandshake,
    title: 'Asesoría',
    description:
      'Te acompañamos en cada ocasión para elegir una pieza especial para alguien especial.',
  },
  {
    icon: Sparkles,
    title: 'Club',
    description:
      'Ofrecemos facilidades de pago y alianzas comerciales para compras planeadas con calma.',
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
 * hero (carrusel), productos destacados, inversión en oro, servicios y testimonios.
 */
export const HomePage = () => {
  return (
    <div className="overflow-x-hidden">
      {/* Hero como carrusel — slide 0 es el banner configurable desde admin */}
      <HeroCarousel promoSlides={PROMO_SLIDES} />
      <FeaturedProductsSection />
      <GoldInvestmentSection />
      <ServicesSection />
      <TestimonialsSection />
    </div>
  );
};

/** Productos destacados justo debajo del hero, replicando la grilla del mockup. */
const FeaturedProductsSection = () => (
  <section
    className="py-14 sm:py-16 lg:py-20"
    style={{ backgroundColor: 'var(--bg-primary)' }}
  >
    <div
      className="mx-auto px-5 sm:px-6 lg:px-10"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <SectionHeading title="Productos destacados" centered />

      <div className="mt-10 grid gap-9 lg:grid-cols-3">
        {FEATURED_GROUPS.map((group, index) => (
          <RevealBlock key={group.title} delay={index * 0.05}>
            <article>
              <h3
                className="mb-7 text-center uppercase"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-bold)',
                  lineHeight: 'var(--leading-tight)',
                  letterSpacing: 'var(--tracking-display)',
                  color: 'var(--text-accent)',
                }}
              >
                {group.title}
              </h3>

              <div className="grid gap-3">
                {group.images.map((image) => (
                  <div
                    key={image.src}
                    className="group aspect-[4/2.75] overflow-hidden shadow-[var(--shadow-xs)] transition-shadow duration-500 hover:shadow-[var(--shadow-md)]"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </article>
          </RevealBlock>
        ))}
      </div>
    </div>
  </section>
);

/** Sección editorial que explica el valor del oro como inversión. */
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
        <h2
          className="uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(var(--text-3xl), 7vw, var(--text-5xl))',
            fontWeight: 'var(--font-bold)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-display)',
            color: 'var(--text-accent)',
          }}
        >
          ¿Por qué
          <br />
          invertir
          <br />
          en oro?
        </h2>

        <div className="mt-8 max-w-md">
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

/** Servicios de taller y asesoría replicados como tarjetas reutilizables. */
const ServicesSection = () => (
  <section
    className="py-16 sm:py-20"
    style={{ backgroundColor: 'var(--bg-secondary)' }}
  >
    <div
      className="mx-auto px-5 sm:px-6 lg:px-10"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <SectionHeading title="Servicios" centered />

      <div className="mt-12 grid gap-x-12 gap-y-14 pl-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-14 lg:gap-y-16">
        {SERVICES.map((service, index) => (
          <RevealBlock key={service.title} delay={index * 0.04}>
            <ServiceCard {...service} />
          </RevealBlock>
        ))}
      </div>
    </div>
  </section>
);

/** Testimonios de clientes con énfasis en la tarjeta central del mockup. */
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

      <div className="mt-10 grid gap-6 md:grid-cols-3 md:items-stretch">
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
