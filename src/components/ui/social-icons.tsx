/**
@file social-icons.tsx
@description Iconos sociales no cubiertos por `lucide-react`.
*/
import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  /** Tamaño del icono en píxeles. */
  size?: number;
  /** Texto accesible opcional cuando el SVG no es decorativo. */
  title?: string;
}

/**
Icono de TikTok en SVG, usando `currentColor` para heredar tokens de color.
*/
export const TikTokIcon = ({ size = 18, title, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : 'true'}
    aria-label={title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M16.6 5.82A5.78 5.78 0 0 0 20 6.91v3.45a9.3 9.3 0 0 1-3.38-.69v6.05A6.28 6.28 0 1 1 10.35 9.5c.28 0 .55.02.82.06v3.56a2.82 2.82 0 1 0 1.97 2.68V2h3.47v3.82Z" />
  </svg>
);

/** Icono de Instagram en SVG con color heredado. */
export const InstagramIcon = ({ size = 18, title, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : 'true'}
    aria-label={title}
    {...props}
  >
    {title && <title>{title}</title>}
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17" cy="7" r="1.2" fill="currentColor" />
  </svg>
);

/** Icono de Facebook en SVG con color heredado. */
export const FacebookIcon = ({ size = 18, title, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : 'true'}
    aria-label={title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M14.2 8.08V6.7c0-.66.44-.82.75-.82h1.9V3.03L14.23 3C11.32 3 10.65 5.18 10.65 6.57v1.51H8.38v3.2h2.27V21h3.42v-9.72h2.55l.34-3.2H14.2Z" />
  </svg>
);

/** Icono de WhatsApp en SVG con color heredado (relleno sólido). */
export const WhatsAppIcon = ({ size = 18, title, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="currentColor"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : 'true'}
    aria-label={title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M26.576 5.363a14.818 14.818 0 0 0-10.511-4.354C7.856 1.009 1.2 7.664 1.2 15.874c0 2.732.737 5.291 2.022 7.491l-.038-.07-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h.006c8.209-.003 14.862-6.659 14.862-14.868a14.82 14.82 0 0 0-4.349-10.507zM16.062 28.228h-.006c-2.319 0-4.489-.64-6.342-1.753l.056.031-.451-.267-4.675 1.227 1.247-4.559-.294-.467a12.23 12.23 0 0 1-1.889-6.565c0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353-5.53 12.353-12.353 12.353zm6.776-9.251c-.371-.186-2.197-1.083-2.537-1.208-.341-.124-.589-.185-.837.187-.246.371-.958 1.207-1.175 1.455-.216.249-.434.279-.805.094a10.23 10.23 0 0 1-2.997-1.852l.01.009a11.236 11.236 0 0 1-2.037-2.521l-.028-.052c-.216-.371-.023-.572.162-.757.167-.166.372-.434.557-.65.146-.179.271-.384.366-.604l.006-.017a.678.678 0 0 0-.033-.653l.002.003c-.094-.186-.836-2.014-1.145-2.758-.302-.724-.609-.625-.836-.637-.216-.01-.464-.012-.712-.012-.395.01-.746.188-.988.463l-.001.002a4.153 4.153 0 0 0-1.299 3.102v-.004a7.233 7.233 0 0 0 1.527 3.857l-.012-.015a16.693 16.693 0 0 0 6.251 5.564l.094.043c.548.248 1.25.513 1.968.74l.149.041a5.103 5.103 0 0 0 2.368.143l-.031.004a3.837 3.837 0 0 0 2.497-1.749l.009-.017a3.122 3.122 0 0 0 .214-1.784l.003.019c-.092-.155-.34-.247-.712-.434z" />
  </svg>
);
