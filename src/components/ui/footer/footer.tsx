/**
 * @file footer.tsx
 * @description Footer público de Joyería KOB alineado al mockup editorial.
 *
 * Usa fondo oscuro de marca, columnas rectas, separadores finos e iconos
 * sociales para reforzar una lectura sobria y prestigiosa.
 */

import { Link } from 'react-router-dom';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from '@/components/ui/social-icons';

const WHATSAPP_NUMBER = '3135007459';
const WHATSAPP_URL = `https://wa.me/57${WHATSAPP_NUMBER}`;

const CATEGORIES = [
  { label: 'Pulseras tejidas', path: '/catalogo' },
  { label: 'Cadenas', path: '/catalogo' },
  { label: 'Pulsos & pulseras', path: '/catalogo' },
  { label: 'Aretes', path: '/catalogo' },
  { label: 'Anillos', path: '/catalogo' },
  { label: 'Dijes', path: '/catalogo' },
] as const;

const INFO_LINKS = [
  'Términos y condiciones de uso - KOB Joyería',
  'Política de garantía, reembolso y devoluciones',
  'Política de privacidad',
  'Materiales',
] as const;

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/joyeria_kob',
    icon: InstagramIcon,
  },
  {
    label: 'TikTok',
    href: '#',
    icon: TikTokIcon,
  },
  {
    label: 'Facebook',
    href: '#',
    icon: FacebookIcon,
  },
] as const;

/** Footer público con columnas de navegación, contacto, información y aliados. */
export const Footer = () => (
  <footer
    style={{
      backgroundColor: 'var(--announcement-bg)',
      color: 'var(--announcement-text)',
      fontFamily: 'var(--font-ui)',
    }}
  >
    <div
      className="mx-auto grid gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[0.8fr_1fr_1.65fr_1.2fr] lg:gap-9 lg:px-10 lg:py-16"
      style={{ maxWidth: 'var(--content-max-width)' }}
    >
      <FooterColumn title="Categorías">
        <ul className="space-y-2.5">
          {CATEGORIES.map(({ label, path }) => (
            <li key={label}>
              <FooterLink to={path}>{label}</FooterLink>
            </li>
          ))}
        </ul>
      </FooterColumn>

      <FooterColumn title="Contacto">
        <ul className="space-y-2.5">
          <li>
            <FooterAnchor href={WHATSAPP_URL}>Hablar por WhatsApp</FooterAnchor>
          </li>
          <li>
            <FooterAnchor href="mailto:kobjoyeria@gmail.com">
              kobjoyeria@gmail.com
            </FooterAnchor>
          </li>
          <li>
            <FooterAnchor href={`tel:+57${WHATSAPP_NUMBER}`}>
              313 500 7459
            </FooterAnchor>
          </li>
          <li>
            <FooterText>El Bordo / Popayán (Cauca)</FooterText>
          </li>
        </ul>
      </FooterColumn>

      <FooterColumn title="Información">
        <ul className="space-y-2.5">
          {INFO_LINKS.map((label) => (
            <li key={label}>
              <FooterLink to="#">{label}</FooterLink>
            </li>
          ))}
        </ul>
      </FooterColumn>

      <FooterColumn title="Proveedores">
        <div className="space-y-3">
          <FooterText>
            ¿Eres fabricante o importador directo de joyería en oro, plata,
            acero o materiales de calidad?
          </FooterText>
          <FooterText>
            Siempre estamos en la búsqueda de nuevos aliados, escríbenos y{' '}
            <strong style={{ color: 'var(--accent-text)' }}>
              envíanos tu catálogo:
            </strong>
          </FooterText>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center justify-center border px-5 py-2.5 text-center transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-85 hover:shadow-[var(--shadow-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            style={{
              borderColor: 'var(--announcement-text)',
              color: 'var(--accent-text)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-bold)',
            }}
          >
            Quiero ser proveedor
          </a>
        </div>
      </FooterColumn>
    </div>

    <div
      className="mx-auto flex flex-col gap-5 border-t px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-10"
      style={{
        maxWidth: 'var(--content-max-width)',
        borderColor:
          'color-mix(in srgb, var(--announcement-text) 58%, transparent)',
      }}
    >
      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--announcement-text)',
          opacity: 0.78,
        }}
      >
        © {new Date().getFullYear()} Joyería KOB. Todos los derechos reservados.
      </p>

      <nav className="flex items-center gap-3" aria-label="Redes sociales">
        {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target={href === '#' ? undefined : '_blank'}
            rel={href === '#' ? undefined : 'noopener noreferrer'}
            className="flex h-9 w-9 cursor-pointer items-center justify-center border transition-[transform,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            style={{
              borderColor:
                'color-mix(in srgb, var(--announcement-text) 68%, transparent)',
              color: 'var(--announcement-text)',
            }}
            aria-label={label}
          >
            <Icon size={18} aria-hidden="true" />
          </a>
        ))}
      </nav>
    </div>
  </footer>
);

interface FooterColumnProps {
  /** Título de columna. */
  title: string;
  /** Contenido de la columna. */
  children: React.ReactNode;
}

/** Columna del footer con separador superior bajo el título. */
const FooterColumn = ({ title, children }: FooterColumnProps) => (
  <section>
    <h2
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--accent-text)',
      }}
    >
      {title}
    </h2>
    <span
      className="mt-3 mb-4 block h-px w-full"
      style={{ backgroundColor: 'var(--announcement-text)' }}
      aria-hidden="true"
    />
    {children}
  </section>
);

/** Enlace interno del footer. */
const FooterLink = ({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) => (
  <Link
    to={to}
    className="transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
    style={{
      fontSize: 'var(--text-sm)',
      color: 'var(--announcement-text)',
      opacity: 0.82,
    }}
  >
    {children}
  </Link>
);

/** Enlace externo o de contacto del footer. */
const FooterAnchor = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    className="transition-opacity duration-200 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-text)]"
    style={{
      fontSize: 'var(--text-sm)',
      color: 'var(--announcement-text)',
      opacity: 0.82,
    }}
  >
    {children}
  </a>
);

/** Texto corto del footer con contraste sobrio sobre el fondo de marca. */
const FooterText = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-normal)',
      color: 'var(--announcement-text)',
      opacity: 0.82,
    }}
  >
    {children}
  </p>
);
