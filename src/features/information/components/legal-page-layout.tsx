/**
 * @file legal-page-layout.tsx
 * @description Maquetación común de las páginas de Información (políticas).
 *
 * Encapsula la cabecera de navegación (botón "Volver" + breadcrumb), el título
 * `<h1>`, la fecha de última actualización y un contenedor de lectura de ancho
 * cómodo (`max-w-3xl`). Replica la estética editorial de las páginas internas
 * (navy/minimal, esquinas rectas) y aplica una transición de entrada sobria con
 * framer-motion, respetando `prefers-reduced-motion`.
 *
 * Reutilizable únicamente dentro de la feature `information`.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

import { SITE_NAME } from '@/config/seo';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  BackToHomeButton,
  BackToHomeDivider,
} from '@/components/ui/back-to-home-button';
import {
  InformationNav,
  INFO_CONTAINER_CLASS,
  INFO_CONTENT_LEFT_PADDING,
  INFO_STRIP_HEIGHT,
} from './information-nav';

/** Variantes de entrada del documento: aparición suave hacia arriba. */
const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

interface LegalPageLayoutProps {
  /** Título del documento; se renderiza como `<h1>`. */
  title: string;
  /** Fecha de última actualización en texto (p. ej. "junio de 2026"). */
  lastUpdated: string;
  /** Etiqueta del último eslabón del breadcrumb. Por defecto, el `title`. */
  breadcrumbLabel?: string;
  /**
   * Meta description única de la página para SEO. Si se omite, no se inyecta
   * `<meta name="description">` (el `<title>` sí se establece siempre).
   */
  description?: string;
  /** Contenido del documento (normalmente una lista de `PolicySection`). */
  children: React.ReactNode;
}

/**
 * Envuelve el contenido de una página de política con cabecera, título, fecha y
 * contenedor de lectura.
 *
 * @param props - Título, fecha, etiqueta de breadcrumb opcional y contenido.
 */
export const LegalPageLayout = ({
  title,
  lastUpdated,
  breadcrumbLabel,
  description,
  children,
}: LegalPageLayoutProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Helmet>
        <title>{`${title} | ${SITE_NAME}`}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>

      {/* Navegación entre secciones (sidebar fijo en desktop, tira en móvil) */}
      <InformationNav />

      <div className={`${INFO_CONTAINER_CLASS} py-8 sm:py-12`}>
        {/* Reserva el alto de la tira fija móvil para que no tape el contenido */}
        <div className={`${INFO_STRIP_HEIGHT} lg:hidden`} aria-hidden="true" />

        {/* En desktop el contenido se desplaza para dejar el hueco del sidebar */}
        <div className={INFO_CONTENT_LEFT_PADDING}>
          {/* Fila superior: botón "Volver" (desktop) + breadcrumb */}
          <div className="mb-6 flex items-center gap-3">
            <BackToHomeButton />
            <BackToHomeDivider />
            <Breadcrumb
              items={[
                { label: 'Inicio', to: '/' },
                { label: breadcrumbLabel ?? title },
              ]}
            />
          </div>

          <motion.article
            // Acota la medida de lectura en <lg (sin sidebar); en lg+ llena la
            // columna ya estrechada por el hueco del sidebar.
            className="max-w-3xl lg:max-w-none"
            variants={pageVariants}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
          >
            <LegalPageHeader title={title} lastUpdated={lastUpdated} />
            {children}
          </motion.article>
        </div>
      </div>
    </div>
  );
};

interface LegalPageHeaderProps {
  /** Título del documento. */
  title: string;
  /** Fecha de última actualización. */
  lastUpdated: string;
}

/** Cabecera del documento: `<h1>`, línea divisoria y fecha de actualización. */
const LegalPageHeader = ({ title, lastUpdated }: LegalPageHeaderProps) => (
  <header className="mb-8">
    <h1
      className="uppercase"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--font-bold)',
        letterSpacing: 'var(--tracking-display)',
        lineHeight: 'var(--leading-tight)',
        color: 'var(--text-primary)',
      }}
    >
      {title}
    </h1>

    <div
      className="mt-4 h-px"
      style={{
        background:
          'linear-gradient(to right, var(--border-strong) 60%, transparent)',
      }}
    />

    <p
      className="mt-4"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
      }}
    >
      Última actualización: {lastUpdated}
    </p>
  </header>
);
