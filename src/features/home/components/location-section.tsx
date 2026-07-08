/**
 * @file location-section.tsx
 * @description Sección "Visítanos" de la página principal: ubicación física,
 * horarios de atención y vías de contacto de Joyería KOB.
 *
 * ## Responsabilidad
 * Cierra la home (antes del footer) invitando a visitar el taller en El Bordo.
 * Combina un **mapa de Google Maps embebido** (iframe perezoso, sin API key ni
 * coste, envuelto en un contenedor con `aspect-ratio` para no provocar CLS) con
 * un panel de datos: estado "Abierto/Cerrado" en vivo, horarios con el día de
 * hoy resaltado, dirección con botón "Cómo llegar" y CTAs de WhatsApp, teléfono
 * y email.
 *
 * ## Estética
 * Reutiliza el patrón editorial del resto de secciones: fondo `bg-grain` (igual
 * que Servicios y Redes), contenedor centrado a `--content-max-width`, encabezado
 * en `--font-display` con línea ornamental y entradas suaves al hacer scroll
 * (`framer-motion` + `useReducedMotion`). Esquinas rectas, coherentes con la
 * identidad de marca.
 *
 * ## SEO
 * Los datos del negocio (dirección, geo, horarios) se declaran en paralelo como
 * JSON-LD `JewelryStore` desde `home-page.tsx` ({@link buildLocalBusinessJsonLd}),
 * que es lo que realmente leen los buscadores: el iframe no aporta SEO.
 *
 * @see structured-data.ts — `BUSINESS` (fuente única de datos) y el JSON-LD.
 */

import { useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';

import { BUSINESS } from '@/config/structured-data';
import {
  buildWhatsAppUrl,
  EMAIL,
  EMAIL_HREF,
  PHONE_DISPLAY,
  PHONE_TEL_HREF,
  WHATSAPP_MESSAGES,
} from '@/config/contact';
import { WhatsAppIcon } from '@/components/ui/social-icons';

/** Fila de horario de un día de la semana. */
interface ScheduleRow {
  /** Día según `Date.getDay()` (0 = domingo … 6 = sábado). */
  dow: number;
  /** Nombre del día en español. */
  day: string;
  /** Texto del horario o "Cerrado". */
  hours: string;
  /** Marca el día sin atención (estilo atenuado). */
  closed?: boolean;
}

/**
 * Horarios de atención. `dow` sigue la convención de `Date.getDay()`
 * (0 = domingo … 6 = sábado) para poder resaltar el día actual.
 */
const SCHEDULE: ScheduleRow[] = [
  { dow: 1, day: 'Lunes', hours: '9:00 a.m. – 6:00 p.m.' },
  { dow: 2, day: 'Martes', hours: '9:00 a.m. – 6:00 p.m.' },
  { dow: 3, day: 'Miércoles', hours: '9:00 a.m. – 6:00 p.m.' },
  { dow: 4, day: 'Jueves', hours: '9:00 a.m. – 6:00 p.m.' },
  { dow: 5, day: 'Viernes', hours: '9:00 a.m. – 6:00 p.m.' },
  { dow: 6, day: 'Sábado', hours: '9:00 a.m. – 6:00 p.m.' },
  { dow: 0, day: 'Domingo', hours: 'Cerrado', closed: true },
];

/** Hora de apertura/cierre en formato 24h (para el estado "Abierto ahora"). */
const OPEN_HOUR = 9;
const CLOSE_HOUR = 18;

/** Dirección completa para mostrar (coincide con el JSON-LD). */
const FULL_ADDRESS = `${BUSINESS.streetAddress}, ${BUSINESS.locality}, ${BUSINESS.region}`;

/**
 * Calcula si la tienda está abierta en este preciso momento según la hora local
 * del visitante (que, para clientes locales, coincide con la de Colombia).
 */
const computeIsOpen = (now: Date): boolean => {
  const day = now.getDay();
  if (day === 0) return false; // Domingo cerrado.
  const hour = now.getHours();
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
};

/** Variantes de entrada suave reutilizadas por los bloques de la sección. */
const REVEAL: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const REVEAL_TRANSITION = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

/**
 * Sección "Visítanos": mapa + horarios + contacto. Cierra la home antes del
 * footer y comparte el patrón visual de las demás bandas (`bg-grain`).
 */
export const LocationSection = () => {
  const shouldReduceMotion = useReducedMotion();

  // Se calcula una vez por render; suficiente para una página que no es SPA-live.
  const { todayDow, isOpen } = useMemo(() => {
    const now = new Date();
    return { todayDow: now.getDay(), isOpen: computeIsOpen(now) };
  }, []);

  /** Props de animación de entrada (anuladas si el usuario reduce movimiento). */
  const reveal = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          variants: REVEAL,
          initial: 'hidden' as const,
          whileInView: 'visible' as const,
          viewport: { once: true, amount: 0.2 },
          transition: { ...REVEAL_TRANSITION, delay },
        };

  return (
    <section
      id="ubicacion"
      className="bg-grain overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div
        className="mx-auto px-5 sm:px-6 lg:px-10"
        style={{ maxWidth: 'var(--content-max-width)' }}
      >
        {/* ── Encabezado ──────────────────────────────────────────────── */}
        <motion.div className="text-center" {...reveal()}>
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
            Visítanos
          </h2>
          <span
            className="mx-auto mt-3 block h-px w-48 max-w-[44vw]"
            style={{ backgroundColor: 'var(--border-strong)' }}
            aria-hidden="true"
          />
          <p
            className="mx-auto mt-5 max-w-md text-sm sm:text-base"
            style={{
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            Te esperamos en nuestro taller en El Bordo para acompañarte a
            encontrar la joya perfecta.
          </p>
        </motion.div>

        {/* ── Mapa + panel de datos ───────────────────────────────────── */}
        <div className="mt-10 grid gap-6 sm:mt-12 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          {/* Mapa (orden 2 en móvil, izquierda en desktop) */}
          <motion.div
            className="relative order-2 aspect-[4/3] min-w-0 overflow-hidden border shadow-[var(--shadow-sm)] transition-shadow duration-500 hover:shadow-[var(--shadow-md)] lg:order-1 lg:aspect-auto lg:min-h-[26rem]"
            style={{ borderColor: 'var(--border-accent)' }}
            {...reveal()}
          >
            <iframe
              src={BUSINESS.mapEmbedUrl}
              title="Ubicación de Joyería KOB en Google Maps"
              className="absolute inset-0 h-full w-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />

            {/* Botón flotante "Cómo llegar" — acento llamativo sobre el mapa */}
            <a
              href={BUSINESS.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2.5 shadow-[var(--shadow-md)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-bold)',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              <Navigation
                size={15}
                strokeWidth={2}
                className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
              CÓMO LLEGAR
            </a>
          </motion.div>

          {/* Panel de datos (orden 1 en móvil, derecha en desktop) */}
          <motion.div
            className="order-1 flex min-w-0 flex-col gap-7 border p-6 sm:p-8 lg:order-2"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-accent)',
            }}
            {...reveal(shouldReduceMotion ? 0 : 0.08)}
          >
            {/* Estado en vivo */}
            <OpenStatusBadge isOpen={isOpen} />

            {/* Dirección */}
            <InfoBlock icon={MapPin} title="Dirección">
              <p
                className="text-sm"
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-normal)',
                }}
              >
                {FULL_ADDRESS}
              </p>
            </InfoBlock>

            {/*
             * Horarios — el título lleva el icono, pero la LISTA va a ancho
             * completo del panel (no indentada bajo el icono). Así cada fila
             * gana ~56px y el horario del día actual (con su badge "Hoy") cabe
             * en una sola línea en móvil sin desbordar el marco.
             */}
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  aria-hidden="true"
                >
                  <Clock size={18} strokeWidth={1.65} />
                </span>
                <h3
                  className="uppercase"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Horarios de atención
                </h3>
              </div>

              <ul className="mt-3 space-y-1.5">
                {SCHEDULE.map((item) => {
                  const isToday = item.dow === todayDow;
                  return (
                    <li
                      key={item.day}
                      className="flex items-baseline justify-between gap-3 text-sm"
                      style={{
                        color: isToday
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                        fontWeight: isToday
                          ? 'var(--font-bold)'
                          : 'var(--font-normal)',
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {item.day}
                        {isToday && (
                          <span
                            className="flex-shrink-0 px-1.5 py-0.5 text-[0.625rem] uppercase leading-none"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: 'var(--accent-text)',
                              letterSpacing: 'var(--tracking-wide)',
                            }}
                          >
                            Hoy
                          </span>
                        )}
                      </span>
                      <span
                        className="flex-shrink-0 whitespace-nowrap"
                        style={
                          item.closed
                            ? { color: 'var(--text-secondary)', opacity: 0.7 }
                            : undefined
                        }
                      >
                        {item.hours}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Contacto */}
            <div className="mt-1 flex flex-col gap-3">
              {/* CTA principal: WhatsApp */}
              <a
                href={buildWhatsAppUrl(WHATSAPP_MESSAGES.visit)}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-5 py-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-bold)',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                <WhatsAppIcon size={18} aria-hidden="true" />
                Escríbenos por WhatsApp
              </a>

              {/* Teléfono y email — enlaces secundarios */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ContactLink
                  href={PHONE_TEL_HREF}
                  icon={Phone}
                  label={PHONE_DISPLAY}
                />
                <ContactLink href={EMAIL_HREF} icon={Mail} label={EMAIL} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/** Píldora de estado "Abierto ahora" / "Cerrado" con punto indicador. */
const OpenStatusBadge = ({ isOpen }: { isOpen: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      {isOpen && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
          style={{ backgroundColor: '#16a34a' }}
        />
      )}
      <span
        className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: isOpen ? '#16a34a' : 'var(--text-secondary)' }}
      />
    </span>
    <span
      className="uppercase"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-bold)',
        letterSpacing: 'var(--tracking-wide)',
        color: isOpen ? '#16a34a' : 'var(--text-secondary)',
      }}
    >
      {isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
    </span>
  </div>
);

interface InfoBlockProps {
  /** Ícono ilustrativo (lucide). */
  icon: typeof MapPin;
  /** Título corto del bloque. */
  title: string;
  /** Contenido del bloque. */
  children: ReactNode;
}

/** Bloque de información con badge de ícono circular + título y contenido. */
const InfoBlock = ({ icon: Icon, title, children }: InfoBlockProps) => (
  <div className="flex gap-4">
    <span
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
      style={{
        backgroundColor: 'var(--accent)',
        color: 'var(--accent-text)',
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-hidden="true"
    >
      <Icon size={18} strokeWidth={1.65} />
    </span>
    <div className="min-w-0 flex-1">
      <h3
        className="uppercase"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-bold)',
          letterSpacing: 'var(--tracking-wide)',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  </div>
);

interface ContactLinkProps {
  /** Destino (`tel:` o `mailto:`). */
  href: string;
  /** Ícono lucide. */
  icon: typeof Phone;
  /** Texto visible del enlace. */
  label: string;
}

/** Enlace de contacto secundario (teléfono/email) con borde e ícono. */
const ContactLink = ({ href, icon: Icon, label }: ContactLinkProps) => (
  <a
    href={href}
    className="group inline-flex items-center justify-center gap-2.5 border px-4 py-2.5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    style={{
      borderColor: 'var(--border-accent)',
      color: 'var(--text-primary)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-ui)',
    }}
  >
    <Icon
      size={16}
      strokeWidth={1.75}
      className="flex-shrink-0"
      style={{ color: 'var(--text-accent)' }}
      aria-hidden="true"
    />
    <span className="truncate">{label}</span>
  </a>
);
