/**
 * @file auth-side-panel.tsx
 * @description Panel decorativo lateral de las páginas de auth (solo desktop).
 *
 * Diseño "Aurora navy" sin fotografías: un fondo azul marino de marca con dos
 * glows que derivan muy lento (efecto aurora) y unos diamantes que flotan y
 * titilan. Encima, el contenido editorial: eyebrow + titular en tipografía
 * display (FELIXTI) + línea de acento + descripción + nota final.
 *
 * Decisiones de diseño:
 * - El panel es navy en ambos temas (es el color de marca), por eso los glows y
 *   diamantes usan colores fijos legibles sobre navy en vez de tokens de tema.
 * - Solo se animan `transform`/`opacity` → barato para la GPU y no invasivo.
 * - Todo respeta `prefers-reduced-motion` (ver index.css).
 */

interface AuthSidePanelProps {
  /** Pequeño texto en mayúsculas sobre el titular. */
  eyebrow: string;
  /** Primera línea del titular. */
  titleTop: string;
  /** Segunda línea del titular (se resalta visualmente). */
  titleAccent: string;
  /** Párrafo descriptivo bajo el titular. */
  description: string;
  /** Línea final breve con micro-beneficios. */
  footnote: string;
}

/** Diamantes decorativos: posición, tamaño y desfase de animación. */
const DIAMONDS = [
  { top: '18%', left: '70%', size: 14, delay: '0s' },
  { top: '32%', left: '22%', size: 9, delay: '2.5s' },
  { top: '58%', left: '78%', size: 11, delay: '1.2s' },
  { top: '72%', left: '30%', size: 7, delay: '3.4s' },
  { top: '45%', left: '50%', size: 8, delay: '4.1s' },
];

export const AuthSidePanel = ({
  eyebrow,
  titleTop,
  titleAccent,
  description,
  footnote,
}: AuthSidePanelProps) => (
  <section
    className="relative hidden overflow-hidden lg:block"
    style={{ backgroundColor: 'var(--accent-active)' }}
    aria-hidden="true"
  >
    {/* ── Aurora: glows que derivan lento ── */}
    <div
      className="animate-drift pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full blur-3xl"
      style={{
        background:
          'radial-gradient(circle, rgba(74,80,196,0.55), transparent 70%)',
      }}
    />
    <div
      className="animate-drift-alt pointer-events-none absolute -bottom-32 -right-24 h-[32rem] w-[32rem] rounded-full blur-3xl"
      style={{
        background:
          'radial-gradient(circle, rgba(99,102,241,0.38), transparent 70%)',
      }}
    />
    <div
      className="animate-drift pointer-events-none absolute bottom-10 left-1/3 h-72 w-72 rounded-full blur-3xl"
      style={{
        background:
          'radial-gradient(circle, rgba(212,175,55,0.20), transparent 70%)',
      }}
    />

    {/* ── Diamantes flotantes ── */}
    {DIAMONDS.map((d, i) => (
      <span
        key={i}
        className="animate-float-diamond pointer-events-none absolute"
        style={{
          top: d.top,
          left: d.left,
          width: d.size,
          height: d.size,
          border: '1px solid rgba(212,175,55,0.6)',
          animationDelay: d.delay,
        }}
      />
    ))}

    {/* ── Contenido ── */}
    <div className="relative z-10 flex h-full flex-col justify-between px-12 py-12 xl:px-16 xl:py-14">
      <span
        className="animate-fade-in-right inline-flex w-fit items-center border px-4 py-1.5 text-xs uppercase tracking-[0.25em]"
        style={{
          borderColor: 'color-mix(in srgb, var(--accent-text) 35%, transparent)',
          color: 'var(--accent-text)',
        }}
      >
        Joyería KOB
      </span>

      <div className="max-w-lg">
        <p
          className="animate-fade-in-right mb-4 text-xs uppercase tracking-[0.35em]"
          style={{ color: 'var(--accent-text)', animationDelay: '120ms' }}
        >
          {eyebrow}
        </p>

        <h1
          className="animate-fade-in-right tracking-display"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--font-bold)',
            lineHeight: 'var(--leading-tight)',
            fontSize: 'clamp(2.75rem, 4vw, 4rem)',
            color: 'var(--accent-text)',
            animationDelay: '200ms',
          }}
        >
          {titleTop}
          <span className="block opacity-80">{titleAccent}</span>
        </h1>

        {/* Línea de acento que se dibuja */}
        <span
          className="animate-draw-line mt-6 block h-px w-24"
          style={{ backgroundColor: 'rgba(212,175,55,0.8)' }}
        />

        <p
          className="animate-fade-in-right mt-6 max-w-md text-base leading-7 xl:text-lg xl:leading-8"
          style={{
            color: 'color-mix(in srgb, var(--accent-text) 88%, transparent)',
            animationDelay: '320ms',
          }}
        >
          {description}
        </p>
      </div>

      <p
        className="animate-fade-in-right text-xs tracking-wide"
        style={{
          color: 'color-mix(in srgb, var(--accent-text) 75%, transparent)',
          animationDelay: '440ms',
        }}
      >
        {footnote}
      </p>
    </div>
  </section>
);
