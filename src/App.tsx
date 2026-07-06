/**
 * @file App.tsx
 * @description Componente raíz de la aplicación Joyería KOB.
 * Inicializa el sistema de temas llamando a `useTheme()`, que sincroniza
 * el estado de Zustand con la clase `dark` del elemento `<html>`.
 * Monta el router y el sistema de notificaciones toast global.
 *
 * El `GoogleOAuthProvider` NO se monta aquí: vive dentro de `GoogleLoginButton`
 * (solo en login/registro), para que el script `gsi/client` de Google y sus
 * fuentes no se carguen en home/catálogo/producto y no alarguen la carga.
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { router } from '@/router';
import { initGA } from '@/analytics/google-analytics';
import { ToastContainer } from '@/components/ui/toast/toast-container';

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
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
};

export default App;