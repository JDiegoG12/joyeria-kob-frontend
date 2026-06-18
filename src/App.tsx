/**
 * @file App.tsx
 * @description Componente raíz de la aplicación Joyería KOB.
 * Inicializa el sistema de temas llamando a `useTheme()`, que sincroniza
 * el estado de Zustand con la clase `dark` del elemento `<html>`.
 * Monta el router y el sistema de notificaciones toast global.
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTheme } from '@/hooks/use-theme';
import { router } from '@/router';
import { initGA } from '@/analytics/google-analytics';
import { ToastContainer } from '@/components/ui/toast/toast-container';

/**
 * Client ID de Google (OAuth 2.0). Si no está configurado, el proveedor se
 * monta igualmente pero los botones de Google no funcionarán: se controla
 * dentro de `GoogleLoginButton`.
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

/**
 * Punto de entrada visual de la aplicación.
 * - `useTheme()` sincroniza el tema con la clase `dark` del `<html>`.
 * - `initGA()` inicializa Google Analytics 4 una vez al montar (no-op si no hay
 *   `VITE_GA_MEASUREMENT_ID`). Las vistas de página las envía `RootLayout`.
 * - `ToastContainer` registra el contenedor global de notificaciones,
 *   que soporta cambio de tema y está integrado con `useToastStore`.
 * - `RouterProvider` monta el sistema de rutas.
 */
const App = () => {
  useTheme();

  useEffect(() => {
    initGA();
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastContainer />
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
};

export default App;