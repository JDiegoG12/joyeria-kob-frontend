/**
 * @file App.tsx
 * @description Componente raíz de la aplicación Joyería KOB.
 * Inicializa el sistema de temas llamando a `useTheme()`, que sincroniza
 * el estado de Zustand con la clase `dark` del elemento `<html>` y monta el router.
 */

import { RouterProvider } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { router } from '@/router';

/**
 * Punto de entrada visual de la aplicación.
 * - `useTheme()` sincroniza el tema con la clase `dark` del `<html>`.
 * - `RouterProvider` monta el sistema de rutas.
 */
export const App = () => {
  useTheme();

  return <RouterProvider router={router} />;
};

export default App;