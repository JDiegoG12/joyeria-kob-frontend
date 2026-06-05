/**
 * @file main.tsx
 * @description Punto de entrada de la aplicación Joyería KOB.
 * Inicializa React en el DOM, inyecta los estilos globales y envuelve
 * la aplicación en `StrictMode` para detectar advertencias de desarrollo.
 * Integra el `<ToastContainer />` en la raíz para habilitar el sistema
 * de notificaciones global en todas las rutas y layouts.
 *
 * Uso:
 * ```bash
 * npm run dev
 * ```
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ToastContainer } from '@/components/ui/toast/toast-container';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ToastContainer />
  </StrictMode>,
);
