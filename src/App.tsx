/**
 * @file App.tsx
 * @description Componente raíz de la aplicación Joyería KOB.
 * Inicializa el sistema de temas llamando a `useTheme()`, que sincroniza
 * el estado de Zustand con la clase `dark` del elemento `<html>`.
 * Monta el router y el sistema de notificaciones toast global.
 */

import { RouterProvider } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { router } from '@/router';
import { ToastContainer } from '@/components/ui/toast/toast-container';

/**
 * Punto de entrada visual de la aplicación.
 * - `useTheme()` sincroniza el tema con la clase `dark` del `<html>`.
 * - `ToastContainer` registra el contenedor global de notificaciones,
 *   que soporta cambio de tema y está integrado con `useToastStore`.
 * - `RouterProvider` monta el sistema de rutas.
 */
const App = () => {
  useTheme();

  return (
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
};

export default App;