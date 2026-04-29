/**
 * @file announcement-bar.tsx
 * @description Barra de anuncios con ticker horizontal deslizante.
 *
 * Se monta encima del Navbar en `MainLayout`. Es un componente independiente
 * para que el Navbar no acumule responsabilidades y pueda ocultarse en rutas
 * que no lo necesiten con solo quitarlo del layout.
 *
 * ## Comportamiento
 * - Texto se desplaza de derecha a izquierda en bucle infinito (CSS puro).
 * - La animación se pausa al hacer hover sobre la barra.
 * - Usa `--announcement-bg` y `--announcement-text` de `tokens.css`.
 *
 * ## Ruta en el proyecto
 * `src/components/announcement-bar/announcement-bar.tsx`
 *
 * ## Uso
 * ```tsx
 * // main-layout.tsx
 * <AnnouncementBar />
 * <Navbar />
 * <main>...</main>
 * ```
 */

import { Gem, ShieldCheck, Truck } from 'lucide-react';

/** Mensajes que se repiten en el ticker. */
const MESSAGES = [
  { id: 1, icon: Truck, text: 'Envíos seguros' },
  { id: 2, icon: Gem, text: 'Oro 18k garantizado' },
  { id: 3, icon: ShieldCheck, text: 'Compras seguras' },
] as const;

export const AnnouncementBar = () => (
  <div
    className="fixed top-0 right-0 left-0 z-50 overflow-hidden"
    style={{
      height: 'var(--announcement-height)',
      backgroundColor: 'var(--announcement-bg)',
      color: 'var(--announcement-text)',
    }}
    role="marquee"
    aria-label="Anuncios de la tienda"
  >
    <style>{`
      @keyframes kob-ticker {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .kob-ticker-track {
        display: flex;
        width: max-content;
        animation: kob-ticker 30s linear infinite;
      }
      .kob-ticker-track:hover {
        animation-play-state: paused;
      }
    `}</style>

    <div className="flex h-full items-center">
      <div className="kob-ticker-track">
        {/* Array duplicado para que el loop sea seamless */}
        {[...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES].map(
          ({ icon: Icon, text }, i) => (
            <span
              key={i}
              className="flex items-center gap-2 whitespace-nowrap px-8"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              <Icon size={14} aria-hidden="true" />
              {text}
              <span
                className="ml-4 h-1 w-1"
                style={{
                  backgroundColor: 'var(--announcement-text)',
                  opacity: 0.35,
                }}
                aria-hidden="true"
              />
            </span>
          ),
        )}
      </div>
    </div>
  </div>
);
