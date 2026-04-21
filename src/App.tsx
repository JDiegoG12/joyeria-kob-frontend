/**
 * @file App.tsx
 @description Componente raíz de la aplicación Joyería KOB.
 * Inicializa el sistema de temas llamando a `useTheme()`, que sincroniza
 * el estado de Zustand con la clase `dark` del elemento `<html>` y monta el router.
 */

import { RouterProvider } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { router } from '@/router';
import { Toaster } from 'react-hot-toast';
/**
 * Punto de entrada visual de la aplicación.
 * - `useTheme()` sincroniza el tema con la clase `dark` del `<html>`.
 * - `RouterProvider` monta el sistema de rutas.
 */
const App = () => {
  useTheme();

  return (
    <>
      {/*  Toast global (notificaciones bonitas) */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />

      {/*  Router de la app */}
      <RouterProvider router={router} />
    </>
  );
};

export default App;