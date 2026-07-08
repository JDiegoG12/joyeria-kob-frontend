/**
 * @file main.tsx
 * @description Punto de entrada de la aplicación Joyería KOB.
 * Inicializa React en el DOM, inyecta los estilos globales y envuelve
 * la aplicación en `StrictMode` para detectar advertencias de desarrollo.
 * Integra el `<ToastContainer />` en la raíz para habilitar el sistema
 * de notificaciones global en todas las rutas y layouts.
 *
 * Fuentes: se importan self-host (@fontsource-variable) ANTES de `index.css`
 * para que Vite las fusione en el bundle CSS render-blocking. Así el `.woff2`
 * queda hasheado DENTRO del CSS (no en el HTML del pre-render) → sin
 * dependencia de hashes en las páginas pre-renderizadas.
 *
 * Uso:
 * ```bash
 * npm run dev
 * ```
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import '@fontsource-variable/montserrat/index.css'; // 'Montserrat Variable' — font-display: swap
import '@fontsource-variable/cinzel/index.css'; // 'Cinzel Variable' — display interino (hasta FELIXTI)
import './index.css';
import App from './App.tsx';
import { ToastContainer } from '@/components/ui/toast/toast-container';

// La pantalla de carga (#kob-loader) NO se retira aquí: la retira el router
// cuando el contenido de la PRIMERA ruta ya montó (pasado su Suspense), para
// que no se vea a la vez que el PageLoader. Ver `BootOverlayDismiss` en el
// router y la red de seguridad de 8 s en index.html.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
      <ToastContainer />
    </HelmetProvider>
  </StrictMode>,
);
