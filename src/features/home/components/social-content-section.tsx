/**
 * @file social-content-section.tsx
 * @description Sección "¡Un poco de nosotros en redes!" de la página principal.
 *
 * ## Responsabilidad
 * Consume `GET /social-contents` y presenta los videos de Joyería KOB en redes
 * (Instagram, TikTok, Facebook) como un **carrusel de tarjetas verticales 9:16**
 * (estilo Reel/TikTok). Cada tarjeta abre el enlace del video en pestaña nueva.
 *
 * La sección solo orquesta: obtiene y **normaliza** los datos crudos del backend
 * a la forma `SocialReel` y delega el render (carrusel, tarjetas, animaciones)
 * en `SocialContentCarousel`.
 *
 * ## HU cubierta: HE-8_HU_07
 * · Con videos → muestra la sección (carrusel con miniatura, título e ícono de
 *   red social).
 * · Sin videos → la sección no se renderiza (oculta por completo).
 *
 * ## Decisiones de implementación
 * · Sin store ni service file separado: el fetch es un GET público sin
 *   paginación ni estado compartido; manejarlo localmente es suficiente.
 * · Se reutiliza `apiClient` (Axios con baseURL e interceptores del proyecto).
 * · Los íconos de red social se resuelven con los SVG compartidos de
 *   `@/components/ui/social-icons` (dentro del carrusel), eliminando los SVG
 *   sociales que antes se duplicaban aquí.
 * · Tokens de diseño CSS (`--bg-*`, `--text-*`, etc.) → light/dark automáticos.
 *
 * ## Estructura de la respuesta esperada del backend
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "title": "Nueva colección primavera",
 *       "imageUrl": "/uploads/social-content/uuid.webp",
 *       "link": "https://www.instagram.com/reel/...",
 *       "socialNetwork": "INSTAGRAM"
 *     }
 *   ]
 * }
 * ```
 *
 * @see social-content-carousel.tsx — carrusel y tarjeta reel que renderiza esto.
 * @example
 * ```tsx
 * // En home-page.tsx — después de <TestimonialsSection />:
 * <SocialContentSection />
 * ```
 */

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { apiClient } from '@/api/api-client';
import { SERVER_URL } from '@/api/server-url';
import {
  SocialContentCarousel,
  type SocialReel,
  type SocialReelPlatform,
} from '@/features/home/components/social-content-carousel';

// ─── Tipos del backend ────────────────────────────────────────────────────────

/** Elemento crudo devuelto por `GET /social-contents`. */
interface SocialContent {
  id: number;
  title: string;
  /** Ruta relativa o URL absoluta de la miniatura. */
  imageUrl?: string;
  /** URL de destino del video. */
  link?: string;
  /** Plataforma (el backend la envía en mayúsculas: `INSTAGRAM`, etc.). */
  socialNetwork?: string;
}

/** Envoltorio estándar `{ success, data }` del backend. */
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// ─── Helpers de normalización ─────────────────────────────────────────────────

/**
 * Convierte una ruta relativa del backend en URL absoluta navegable.
 * Si ya es absoluta (`http...`), la devuelve sin cambios.
 *
 * @param url - Valor de `imageUrl`.
 * @returns URL lista para `src`, o cadena vacía si no hay valor.
 */
const resolveThumbnailUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER_URL}${url}`;
};

/**
 * Normaliza la plataforma recibida (case-insensitive) a un slug interno.
 * Defiende contra `undefined` y valores inesperados.
 *
 * @param socialNetwork - Valor crudo de `socialNetwork`.
 * @returns Plataforma normalizada en minúsculas.
 */
const resolvePlatform = (socialNetwork?: string): SocialReelPlatform => {
  switch ((socialNetwork ?? '').toLowerCase()) {
    case 'instagram':
      return 'instagram';
    case 'tiktok':
      return 'tiktok';
    case 'facebook':
      return 'facebook';
    case 'youtube':
      return 'youtube';
    default:
      return 'external';
  }
};

/** Mapea un item crudo del backend a la forma `SocialReel` del carrusel. */
const toReel = (item: SocialContent): SocialReel => ({
  id: item.id,
  title: item.title,
  link: item.link || '#',
  platform: resolvePlatform(item.socialNetwork),
  thumbnailUrl: resolveThumbnailUrl(item.imageUrl),
});

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Sección de videos en redes sociales de la home.
 *
 * No renderiza nada hasta que la petición resuelve (evita un flash del
 * encabezado vacío) y se oculta por completo si no hay videos configurados.
 */
export const SocialContentSection = () => {
  const [reels, setReels] = useState<SocialReel[]>([]);
  const [loaded, setLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    apiClient
      .get<ApiEnvelope<SocialContent[]>>('/social-contents')
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setReels(res.data.data.map(toReel));
        }
      })
      .catch(() => {
        // Falla silenciosa: la sección simplemente no se mostrará.
      })
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || reels.length === 0) return null;

  /** Entrada suave (fade + translate) respetando movimiento reducido. */
  const reveal = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.18 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section
      className="overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="mx-auto px-5 sm:px-6 lg:px-10"
        style={{ maxWidth: 'var(--content-max-width)' }}
      >
        {/* ── Encabezado ──────────────────────────────────────────────── */}
        <motion.div className="text-center" {...reveal}>
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
            ¡Un poco de nosotros en redes!
          </h2>

          <span
            className="mx-auto mt-3 block h-px w-48 max-w-[44vw]"
            style={{ backgroundColor: 'var(--border-strong)' }}
            aria-hidden="true"
          />
        </motion.div>

        {/* ── Carrusel ────────────────────────────────────────────────── */}
        <motion.div className="mt-10" {...reveal}>
          <SocialContentCarousel items={reels} />
        </motion.div>
      </div>
    </section>
  );
};
