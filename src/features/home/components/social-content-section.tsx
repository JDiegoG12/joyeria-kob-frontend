/**
 * @file social-content-section.tsx
 * @description Sección de contenido social/multimedia en la página principal.
 *
 * ## Responsabilidad
 * Consume `GET /api/social-contents` y presenta los videos publicitarios de
 * Joyería KOB como tarjetas editoriales que abren el enlace en pestaña nueva.
 *
 * ## HU cubierta: HE-8_HU_07
 * · Si existen videos → muestra la sección con tarjetas (miniatura, título,
 *   ícono de red social).
 * · Si no hay videos  → la sección no se renderiza (oculta completamente).
 * · Al hacer clic en una tarjeta → abre `linkUrl` en nueva pestaña.
 *
 * ## Decisiones de implementación
 * · Sin store ni service file separado: el fetch es un GET público sin
 *   paginación ni estado compartido, por lo que manejar todo localmente
 *   (`useState` + `useEffect`) es suficiente y más simple.
 * · Se reutiliza `apiClient` (Axios configurado en `@/api/api-client`) para
 *   respetar el interceptor de baseURL y consistencia con el resto del proyecto.
 * · Los íconos de red social se resuelven en función del campo `platform`
 *   que devuelve el backend (`youtube`, `instagram`, `tiktok`, `facebook`).
 * · La sección completa usa los tokens de diseño CSS del proyecto
 *   (`--bg-*`, `--text-*`, `--border-*`, etc.) para adaptarse
 *   automáticamente a los modos claro y oscuro.
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
 *       "link": "https://youtube.com/watch?v=...",
 *       "socialNetwork": "INSTAGRAM"
 *     }
 *   ]
 * }
 * ```
 *
 * @example
 * ```tsx
 * // En home-page.tsx — después de <TestimonialsSection />:
 * <SocialContentSection />
 * ```
 */

import { useEffect, useState } from 'react';

import { ExternalLink } from 'lucide-react';
import { apiClient } from '@/api/api-client';
import { SERVER_URL } from '@/api/server-url';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Plataformas de red social soportadas.
 * El backend devuelve el slug en mayúsculas.
 */
type SocialPlatform =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'external';

/**
 * Elemento de contenido social devuelto por `GET /api/social-contents`.
 */
interface SocialContent {
  /** Identificador único del contenido. */
  id: number;

  /** Título del video o publicación mostrado en la tarjeta. */
  title: string;

  /**
   * Ruta relativa o URL absoluta de la miniatura.
   */
  imageUrl?: string;

  /** URL de destino que se abre al hacer clic en la tarjeta. */
  link?: string;

  /** Plataforma de la red social. */
  socialNetwork?: string;
}

/** Envoltorio estándar `{ success, data }` que usa el backend. */
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// ─── Helper: resolver URL de imagen ──────────────────────────────────────────

/**
 * Convierte una ruta relativa del backend en una URL absoluta navegable.
 * Si `url` ya es absoluta (empieza por `http`), la devuelve sin modificar.
 *
 * @param url - Valor de `imageUrl` devuelto por el backend.
 * @returns URL lista para usar como `src` de una `<img>`.
 */
const resolveThumbnailUrl = (url?: string): string => {
  if (!url) return '';

  if (url.startsWith('http')) return url;

  return `${SERVER_URL}${url}`;
};

// ─── Helper: resolver plataforma ─────────────────────────────────────────────

/**
 * Normaliza la plataforma recibida desde backend.
 *
 * Evita errores como:
 * `Cannot read properties of undefined (reading 'toLowerCase')`
 */
const resolvePlatform = (
  socialNetwork?: string,
): SocialPlatform => {
  if (!socialNetwork) return 'external';

  const normalized = socialNetwork.toLowerCase();

  switch (normalized) {
    case 'instagram':
      return 'instagram';

    case 'facebook':
      return 'facebook';

    case 'tiktok':
      return 'tiktok';

    case 'youtube':
      return 'youtube';

    default:
      return 'external';
  }
};

// ─── Helper: ícono SVG de red social ─────────────────────────────────────────

/**
 * Devuelve el SVG inline correcto para cada plataforma.
 *
 * Se usan paths SVG propios (no `lucide-react`, que no incluye íconos de
 * redes sociales) de tamaño normalizado para facilitar el centrado.
 *
 * `fill="currentColor"` permite que el color lo controle el contenedor CSS.
 */
const PlatformIcon = ({
  platform,
  size = 16,
}: {
  platform?: SocialPlatform;
  size?: number;
}) => {
  const normalizedPlatform = String(platform || '').toLowerCase();

  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true as const,
  };

  switch (normalizedPlatform) {
    case 'youtube':
      return (
        <svg {...props}>
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
        </svg>
      );

    case 'instagram':
      return (
        <svg {...props}>
          <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12c0-3.2 0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.2 8.4 2.2 8.8 2.2 12 2.2ZM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24c3.3 0 3.7 0 4.9-.1 4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0Zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z" />
        </svg>
      );

    case 'tiktok':
      return (
        <svg {...props}>
          <path d="M19.6 8.6a9.6 9.6 0 0 1-5.6-1.8V15a6.5 6.5 0 1 1-6.5-6.5h.7v3.2h-.7a3.3 3.3 0 1 0 3.3 3.3V0h3.2a6.4 6.4 0 0 0 5.6 5.5v3.1Z" />
        </svg>
      );

    case 'facebook':
      return (
        <svg {...props}>
          <path d="M24 12a12 12 0 1 0-13.9 11.9V15.5H7v-3.5h3.1v-2.7c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 1-2 2v2.2H17l-.5 3.5h-3v8.4A12 12 0 0 0 24 12Z" />
        </svg>
      );

    default:
      return (
        <ExternalLink
          size={size}
          strokeWidth={1.8}
          style={{ flexShrink: 0 }}
          aria-hidden
        />
      );
  }
};

// ─── Componente: tarjeta de contenido social ───────────────────────────────────

interface SocialContentCardProps {
  item: SocialContent;
}

/**
 * Tarjeta editorial de contenido social.
 */
const SocialContentCard = ({ item }: SocialContentCardProps) => {
  const [imgError, setImgError] = useState(false);

  const thumbnail = resolveThumbnailUrl(item.imageUrl);

  /**
   * FIX:
   * Normalizar plataforma para evitar undefined.
   */
  const platform = resolvePlatform(item.socialNetwork);

  return (
    <a
      href={item.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ver "${item.title}" en ${platform}`}
      className="group flex flex-col overflow-hidden border transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-accent)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-accent)',
        textDecoration: 'none',
      }}
    >
      {/* ── Miniatura ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '16 / 10' }}
      >
        {!imgError && thumbnail ? (
          <img
            src={thumbnail}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <span
              style={{
                color: 'var(--text-muted)',
                opacity: 0.4,
              }}
            >
              <PlatformIcon platform={platform} size={40} />
            </span>
          </div>
        )}

        {/* Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
          style={{
            background:
              'color-mix(in srgb, var(--accent-active) 48%, transparent)',
          }}
          aria-hidden="true"
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 48,
              height: 48,
              backgroundColor:
                'color-mix(in srgb, var(--accent-text) 92%, transparent)',
              color: 'var(--accent)',
            }}
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              style={{ marginLeft: 3 }}
            >
              <path d="M5 3l14 9-14 9V3Z" />
            </svg>
          </span>
        </div>

        {/* Badge */}
        <span
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--accent-active) 82%, transparent)',
            color: 'var(--accent-text)',
            backdropFilter: 'blur(4px)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-semibold)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
          }}
        >
          <PlatformIcon platform={platform} size={11} />
          {platform}
        </span>
      </div>

      {/* ── Pie ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-250 group-hover:bg-[var(--bg-hover)] sm:px-5 sm:py-4"
        style={{ flex: 1 }}
      >
        <span
          style={{
            color: 'var(--text-accent)',
            flexShrink: 0,
            opacity: 0.8,
          }}
        >
          <PlatformIcon platform={platform} size={15} />
        </span>

        <span
          className="line-clamp-2 flex-1"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            lineHeight: 'var(--leading-snug)',
            color: 'var(--text-secondary)',
            transition: 'color 250ms ease',
          }}
        >
          {item.title}
        </span>

        <span
          className="shrink-0 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transition-none"
          style={{ color: 'var(--text-accent)' }}
          aria-hidden="true"
        >
          <ExternalLink size={13} strokeWidth={1.8} />
        </span>
      </div>
    </a>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Sección de contenido social/multimedia de la página principal.
 */
export const SocialContentSection = () => {
  const [items, setItems] = useState<SocialContent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiClient
      .get<ApiEnvelope<SocialContent[]>>('/social-contents')
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setItems(res.data.data);
        }
      })
      .catch(() => {
        // Falla silenciosa
      })
      .finally(() => setLoaded(true));
  }, []);

  /*
   * Antes de que la petición resuelva, no renderizar nada para evitar
   * un flash del encabezado vacío.
   */
  if (!loaded || items.length === 0) return null;

  return (
    <section
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="mx-auto px-5 sm:px-6 lg:px-10"
        style={{ maxWidth: 'var(--content-max-width)' }}
      >
        {/* ── Encabezado ──────────────────────────────────────────────── */}
        <div className="text-center">
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
            Videos
          </h2>

          <span
            className="mx-auto mt-3 block h-px w-48 max-w-[44vw]"
            style={{ backgroundColor: 'var(--border-strong)' }}
            aria-hidden="true"
          />
        </div>

        {/* ── Grid ────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <SocialContentCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};