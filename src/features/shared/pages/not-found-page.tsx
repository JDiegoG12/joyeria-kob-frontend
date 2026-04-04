/**
 * @file not-found-page.tsx
 * @description Página 404 mostrada cuando el usuario accede a una ruta inexistente.
 */

import { useNavigate } from 'react-router-dom';

/**
 * Página de error 404.
 * Captura cualquier ruta no definida en el router (`path: '*'`).
 * Ofrece un botón para regresar al catálogo principal.
 */
export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-kob-gold-50 dark:bg-kob-black">
      <h1 className="font-serif text-6xl font-bold text-kob-gold-500">404</h1>
      <p className="font-serif text-xl text-kob-black dark:text-white">
        Esta página no existe
      </p>
      <button
        onClick={() => navigate('/catalogo')}
        className="mt-2 rounded-md bg-kob-gold-500 px-6 py-2 text-white transition-colors hover:bg-kob-gold-600"
      >
        Volver al catálogo
      </button>
    </div>
  );
};