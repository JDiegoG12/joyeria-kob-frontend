/**
 * @file auth-mobile-banner.tsx
 * @description Franja de marca para la cabecera de la tarjeta en MÓVIL.
 *
 * En desktop el lado izquierdo ya tiene el panel "Aurora navy"; en móvil ese
 * panel se oculta y la tarjeta quedaba demasiado plana. Este banner trae la
 * misma personalidad (navy + aurora + diamantes) en formato compacto a la parte
 * superior de la tarjeta. Solo se muestra hasta `lg` (`lg:hidden`), por lo que
 * la vista de escritorio no cambia.
 *
 * Va a sangre completa dentro de la tarjeta mediante márgenes negativos que
 * compensan el padding del contenedor (p-6 / sm:p-8).
 */

interface AuthMobileBannerProps {
  /** Línea breve bajo el wordmark (reutiliza la nota del panel de escritorio). */
  tagline: string;
}

export const AuthMobileBanner = ({ tagline }: AuthMobileBannerProps) => (
  <div
    className="relative -mx-6 -mt-6 mb-6 overflow-hidden px-6 py-7 sm:-mx-8 sm:-mt-8 sm:px-8 lg:hidden"
    style={{ backgroundColor: 'var(--accent-active)' }}
    aria-hidden="true"
  >
    {/* Aurora compacta */}
    <div
      className="animate-drift pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full blur-2xl"
      style={{
        background: 'radial-gradient(circle, rgba(74,80,196,0.55), transparent 70%)',
      }}
    />
    <div
      className="animate-drift-alt pointer-events-none absolute -bottom-12 right-0 h-44 w-44 rounded-full blur-2xl"
      style={{
        background: 'radial-gradient(circle, rgba(212,175,55,0.20), transparent 70%)',
      }}
    />

    {/* Diamantes flotantes */}
    <span
      className="animate-float-diamond pointer-events-none absolute right-8 top-5"
      style={{ width: 10, height: 10, border: '1px solid rgba(212,175,55,0.6)' }}
    />
    <span
      className="animate-float-diamond pointer-events-none absolute left-10 bottom-5"
      style={{
        width: 7,
        height: 7,
        border: '1px solid rgba(212,175,55,0.6)',
        animationDelay: '2.2s',
      }}
    />

    {/* Wordmark + línea + tagline */}
    <div className="relative z-10">
      <p
        className="text-[0.65rem] uppercase tracking-[0.4em]"
        style={{ color: 'color-mix(in srgb, var(--accent-text) 70%, transparent)' }}
      >
        Joyería
      </p>
      <p
        className="leading-none"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--font-bold)',
          fontSize: '2rem',
          letterSpacing: 'var(--tracking-display)',
          color: 'var(--accent-text)',
        }}
      >
        KOB
      </p>
      <span
        className="mt-3 block h-px w-16"
        style={{ backgroundColor: 'rgba(212,175,55,0.8)' }}
      />
      <p
        className="mt-3 text-xs leading-5"
        style={{ color: 'color-mix(in srgb, var(--accent-text) 80%, transparent)' }}
      >
        {tagline}
      </p>
    </div>
  </div>
);
