/// <reference types="vite/client" />

/**
 * Tipado de las variables de entorno expuestas por Vite (`import.meta.env`).
 * Solo se declaran las variables propias del proyecto con prefijo `VITE_`.
 */
interface ImportMetaEnv {
  /** URL base de la API del backend. */
  readonly VITE_API_URL: string;
  /** ID de medición de Google Analytics 4 (formato `G-XXXXXXXXXX`). Opcional. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /**
   * Retira la pantalla de carga inicial (`#kob-loader`, definida en index.html).
   * Se define en el `<head>` para sobrevivir aunque el bundle falle; la app la
   * invoca cuando el contenido de la primera ruta ya montó (ver router).
   */
  __kobHideLoader?: () => void;
}
