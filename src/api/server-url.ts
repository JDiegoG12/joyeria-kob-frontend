/**
 * URL base del servidor de archivos estáticos (imágenes en /uploads).
 *
 * Se obtiene quitando el sufijo "/api" de VITE_API_URL.
 *
 * Importante: la regex está anclada al final (`$`). Un `.replace('/api', '')`
 * sin anclar matchea la primera ocurrencia de "/api", que puede caer dentro
 * del subdominio (ej: "https://api.joyeriakob.com/api" → "https:/.joye...").
 */
export const SERVER_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/?$/, '');
