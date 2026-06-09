/**
 * @file scroll-to-top.tsx
 * @description Resetea el scroll al inicio cuando cambia la ruta.
 *
 * ─── Problema que resuelve ────────────────────────────────────────────────────
 * `createBrowserRouter` no restaura ni resetea el scroll al navegar entre rutas
 * (a diferencia de la navegación nativa del navegador con recarga completa).
 * Sin esto, al pasar de una página a otra el `scrollY` previo se conserva y el
 * usuario aterriza en mitad de la página destino en lugar de en su inicio.
 *
 * Montado una sola vez dentro de `MainLayout`, cubre todas las rutas públicas
 * (inicio, catálogo, favoritos, perfil) y cualquier navegación entre ellas,
 * sin importar qué componente la dispare (CatalogNavBar, Footer, MobileMenu…).
 *
 * ─── Por qué solo `pathname` ──────────────────────────────────────────────────
 * El efecto depende exclusivamente del `pathname`, no de la `location` completa.
 * Así NO se dispara cuando solo cambian los query params en la misma ruta
 * (p. ej. filtros del catálogo `?categoria=` o deep-link `?product=`), evitando
 * saltos inesperados al filtrar o abrir el modal de detalle sin cambiar de página.
 *
 * ─── Excepción: scroll a una sección concreta ────────────────────────────────
 * Cuando se navega con `location.state.scrollTo` (el ítem "Servicios" del menú
 * móvil lo usa para ir a `#servicios` dentro de la home), NO se resetea el
 * scroll: se cede el control a `HomePage`, que hace el scroll suave a la sección
 * tras montar. Resetear aquí pelearía con ese scroll diferido.
 *
 * ─── useLayoutEffect ──────────────────────────────────────────────────────────
 * Se usa `useLayoutEffect` (no `useEffect`) para resetear el scroll de forma
 * síncrona antes del primer pintado de la nueva página, evitando un parpadeo
 * en el que la página destino se ve momentáneamente desplazada.
 */

import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente sin render: resetea `window.scrollTo(0, 0)` en cada cambio de ruta.
 *
 * Debe montarse dentro del árbol del router (tiene acceso a `useLocation`).
 * En `MainLayout` va junto al resto del layout público.
 */
export const ScrollToTop = () => {
  const { pathname, state } = useLocation();

  useLayoutEffect(() => {
    // Si la navegación pide ir a una sección concreta, deja que la página
    // destino gestione su propio scroll diferido (ver HomePage).
    if ((state as { scrollTo?: string } | null)?.scrollTo) return;

    window.scrollTo(0, 0);
  }, [pathname, state]);

  return null;
};
