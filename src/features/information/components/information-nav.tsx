/**
 * @file information-nav.tsx
 * @description Navegación entre las secciones de Información sin tener que bajar
 * al footer. Adapta su forma al breakpoint:
 *
 * - **Desktop (lg+):** sidebar vertical anclado en el costado izquierdo, junto a
 *   la columna de lectura.
 * - **Móvil/tablet (<lg):** tira horizontal de "pills" con scroll propio, bajo
 *   el navbar.
 *
 * ## Por qué `position: fixed` (y no `sticky`)
 * El contenedor raíz de `MainLayout` usa `overflow-hidden`, lo que invalida
 * `position: sticky` en todos sus descendientes (mismo motivo documentado en
 * `catalog-nav-bar.tsx`). Por eso ambas variantes usan `fixed` + un spacer en el
 * flujo para reservar su espacio. Así la navegación permanece visible al
 * desplazarse por documentos largos.
 *
 * ## Alineación del sidebar
 * El sidebar fijo se envuelve en el MISMO contenedor centrado que la página
 * ({@link INFO_CONTAINER_CLASS}); así su borde izquierdo coincide siempre con el
 * de la columna de lectura sin cálculos frágiles. El wrapper es
 * `pointer-events-none` y solo el `<nav>` recupera los eventos, para no bloquear
 * el contenido a su derecha.
 *
 * ## z-index
 * `z-30`: por encima del contenido de página, por debajo del navbar (`z-40`) y
 * de overlays/modales (`z-50`). Cuando el footer (también apilado) sube al hacer
 * scroll, lo tapa de forma natural, evitando solapamientos feos.
 */

import { NavLink } from 'react-router-dom';

import {
  INFORMATION_SECTIONS,
  type IInformationLink,
} from '../data/information-sections';

/**
 * Clases del contenedor centrado. La página ({@link LegalPageLayout}) y el
 * sidebar fijo DEBEN compartir estas clases para quedar alineados.
 */
export const INFO_CONTAINER_CLASS = 'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8';

/**
 * Hueco izquierdo (ancho del sidebar + gap) que reserva la columna de lectura en
 * desktop para no quedar bajo el sidebar fijo. En <lg es 0 (una sola columna).
 */
export const INFO_CONTENT_LEFT_PADDING = 'lg:pl-[15.5rem]';

/** Alto de la tira móvil; el spacer del layout debe usar el mismo valor. */
export const INFO_STRIP_HEIGHT = 'h-14';

/** Desplazamiento vertical bajo las barras fijas (announcement + navbar). */
const TOP_UNDER_NAVBAR = 'calc(var(--announcement-height) + var(--navbar-height))';

/**
 * Navegación entre secciones de Información. Renderiza ambas variantes (sidebar
 * desktop y tira móvil); cada una se muestra solo en su breakpoint.
 */
export const InformationNav = () => (
  <>
    <InformationSidebar />
    <InformationStrip />
  </>
);

/** Sidebar vertical fijo, alineado a la columna de lectura. Solo desktop. */
const InformationSidebar = () => (
  <div
    className="pointer-events-none fixed inset-x-0 z-30 hidden lg:block"
    style={{ top: `calc(${TOP_UNDER_NAVBAR} + 2rem)` }}
  >
    <div className={INFO_CONTAINER_CLASS}>
      <nav aria-label="Secciones de información" className="pointer-events-auto w-52">
        <p
          translate="no"
          className="mb-3"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            letterSpacing: 'var(--tracking-widest)',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Información
        </p>

        <ul className="space-y-1">
          {INFORMATION_SECTIONS.map((section) => (
            <li key={section.to}>
              <SidebarLink {...section} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </div>
);

/** Enlace del sidebar: barra de acento + cambio tipográfico en el activo. */
const SidebarLink = ({ label, to }: IInformationLink) => (
  <NavLink
    to={to}
    className="group relative block py-2.5 pr-3 pl-4 transition-colors duration-200 hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
  >
    {({ isActive }) => (
      <>
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-[2px] transition-transform duration-200"
          style={{
            backgroundColor: 'var(--accent)',
            transformOrigin: 'center',
            transform: isActive ? 'scaleY(1)' : 'scaleY(0)',
          }}
        />
        <span
          className="transition-colors duration-200 group-hover:text-[var(--text-primary)]"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-base)',
            fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
      </>
    )}
  </NavLink>
);

/** Tira horizontal fija con scroll propio, bajo el navbar. Solo móvil/tablet. */
const InformationStrip = () => (
  <div
    className="fixed inset-x-0 z-30 border-b lg:hidden"
    style={{
      top: TOP_UNDER_NAVBAR,
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-color)',
      boxShadow: 'var(--shadow-xs)',
    }}
  >
    {/*
     * Las 4 secciones se reparten el ancho (cada `li` es `flex-1`) para que
     * quepan a la vez sin scroll en móviles comunes. `overflow-x-auto` queda
     * como red de seguridad: en pantallas muy estrechas, donde el texto ya no
     * cabe, la tira hace scroll propio en lugar de romper el layout.
     */}
    <nav
      aria-label="Secciones de información"
      className={`${INFO_STRIP_HEIGHT} overflow-x-auto`}
    >
      <ul className="flex h-full items-center gap-1.5 px-3">
        {INFORMATION_SECTIONS.map((section) => (
          <li key={section.to} className="flex-1">
            <StripLink {...section} />
          </li>
        ))}
      </ul>
    </nav>
  </div>
);

/** "Pill" de la tira móvil. Activo = relleno de acento; resto = contorno. */
const StripLink = ({ label, to }: IInformationLink) => (
  <NavLink
    to={to}
    className="flex h-9 w-full items-center justify-center border px-1.5 text-center whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
    style={({ isActive }) => ({
      fontFamily: 'var(--font-ui)',
      // Tamaño compacto (11px) deliberado: permite que las 4 pills entren a la
      // vez en pantallas pequeñas conservando el uppercase de la marca.
      fontSize: '0.6875rem',
      fontWeight: isActive ? 'var(--font-bold)' : 'var(--font-medium)',
      letterSpacing: 'var(--tracking-normal)',
      textTransform: 'uppercase',
      borderColor: isActive ? 'var(--accent)' : 'var(--border-color)',
      backgroundColor: isActive ? 'var(--accent)' : 'transparent',
      color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
    })}
  >
    {label}
  </NavLink>
);
