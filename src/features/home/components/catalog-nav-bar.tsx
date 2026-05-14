/**
 * @file catalog-nav-bar.tsx
 * @description Barra de navegación rápida al catálogo — estética luxury/editorial.
 *
 * ─── Posicionamiento ──────────────────────────────────────────────────────────
 * La barra usa `position: fixed` porque el contenedor raíz de `MainLayout`
 * tiene `overflow-hidden`, lo que invalida `position: sticky` en cualquier
 * descendiente. Se apila justo debajo del navbar principal:
 *
 *   top = --announcement-height + --navbar-height
 *
 * El contenido de la página se desplaza hacia abajo con `<CatalogNavBarSpacer>`,
 * que debe montarse inmediatamente después de `<CatalogNavBar />`.
 *
 * ─── Layout de la barra ───────────────────────────────────────────────────────
 * · Izquierda : "CATÁLOGO" → /catalogo limpiando todos los filtros activos.
 * · Centro    : categorías raíz. Al hover aparece el panel de subcategorías.
 * · Derecha   : "SERVICIOS" → scroll suave hasta el elemento `#servicios`.
 *
 * ─── Filosofía de diseño (rev. luxury editorial) ─────────────────────────────
 * Inspirado en navegaciones de casas de moda/joyería de alto nivel
 * (Cartier, Boucheron, Loewe, Net-a-Porter):
 *
 * 1. **Panel claro, no oscuro.** El fondo navy de la versión anterior se
 *    leía como un dropdown funcional. Ahora el panel usa `--bg-secondary`,
 *    que adapta automáticamente entre blanco (light) y gris elevado (dark).
 *    El navy queda reservado únicamente como acento (línea de hover, dot
 *    indicator, arrow) — nunca como fondo.
 *
 * 2. **Indicador editorial, no UI.** El subrayado de 2px del estado activo
 *    se reemplaza por un punto centrado de 4px bajo el texto. Es el patrón
 *    de Cartier: minimalista, simétrico, no compite con la tipografía.
 *
 * 3. **Tipografía calibrada.** En la barra se mantiene uppercase tracking
 *    widest (utilitaria, navegacional) pero baja a `--font-medium`. En el
 *    panel los items son sentence/title case con tracking-wide y tamaño
 *    `--text-sm` — más legibles, más editoriales, claro contraste con la
 *    barra superior.
 *
 * 4. **Sin separadores entre items.** Los separadores horizontales fragmentan
 *    visualmente y son un patrón típico de UI funcional. El hover por sí solo
 *    (background + trazo izquierdo + arrow) ya marca cada item con claridad.
 *
 * 5. **Animaciones lentas y sin rebote.** Curvas `cubic-bezier(0.22, 1, 0.36, 1)`
 *    (easeOutQuart suavizado), nunca springs con overshoot. El rebote
 *    transmite "juguetón", no "luxury". Duraciones generosas (350-450ms).
 *
 * ─── Adaptación light / dark ──────────────────────────────────────────────────
 * Todos los colores se resuelven a través de tokens semánticos definidos en
 * `tokens.css`. La misma hoja de estilos funciona en ambos modos sin lógica
 * condicional. Mapa de tokens usados:
 *
 *   Panel       → `--bg-secondary`     (#FFFFFF light · #222222 dark)
 *   Borde panel → `--border-color`     (#DCDCDC light · #2C2C2C dark)
 *   Sombra      → `--shadow-lg`        (más densa en dark)
 *   Texto bar   → `--text-accent`      (#131638 light · #F3F3F3 dark)
 *   Texto sub   → `--text-secondary`   (reposo)
 *   Texto hover → `--text-primary`     (sub items en hover)
 *   Hover bg    → `--bg-hover`         (tinte navy translúcido en ambos modos)
 *   Acento      → `--text-accent`      (dot, trazo izquierdo, arrow)
 *
 * ─── Continuidad de hover (sin bridge artificial) ────────────────────────────
 * El panel se posiciona con `top: 100%` del contenedor del ítem, lo que lo
 * pega exactamente al borde inferior del botón (sin gap). Como el panel es
 * descendiente DOM del contenedor con `onMouseLeave`, el cursor que viaja
 * del botón al panel nunca sale del subtree → `onMouseLeave` no dispara.
 * No se necesita `paddingBottom` artificial ni elemento puente.
 *
 * Versiones anteriores usaban `paddingBottom` en el contenedor como bridge,
 * pero esto encogía la altura efectiva del botón (box-sizing border-box +
 * altura forzada por el flex padre), lo que recentraba el texto hacia arriba
 * — el efecto que el usuario percibía como "elevación" del item al hover.
 *
 * ─── Store ────────────────────────────────────────────────────────────────────
 * Usa `useCategoryStore` exclusivamente, igual que `CatalogFilterSidebar` y
 * `CatalogPage`. Las subcategorías se leen de `category.children`.
 *
 * @example
 * ```tsx
 * // En home-page.tsx — el orden de montaje importa:
 * <CatalogNavBar />
 * <CatalogNavBarSpacer />   ← empuja el contenido debajo de la barra fija
 * <HeroCarousel promoSlides={PROMO_SLIDES} />
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useCategoryStore } from '@/store/category.store';
import type { Category } from '@/features/categories/types/category.types';

// ─── Constantes de layout ─────────────────────────────────────────────────────

/** Altura de la barra en px. Debe coincidir con `CatalogNavBarSpacer`. */
const NAV_BAR_HEIGHT = 48;

/**
 * Ancho mínimo del panel de subcategorías en px.
 *
 * Calibrado para 4-7 items en una sola columna con padding generoso.
 * Más estrecho se sentiría apretado; más ancho desperdicia espacio en
 * categorías con pocos hijos.
 */
const PANEL_MIN_WIDTH_PX = 380;

// ─── Curvas de animación premium ──────────────────────────────────────────────

/**
 * Easing principal para entradas — easeOutQuart suavizado.
 *
 * Decelera con elegancia sin "snap" inicial brusco. Es la curva estándar
 * de transiciones premium en frameworks como Material You y la mayoría de
 * design systems luxury.
 */
const EASE_OUT_PREMIUM: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Easing simétrico para transiciones reversibles (chevron, salidas).
 *
 * easeInOut estándar — natural en ambos sentidos, sin overshoot.
 * Reemplaza el spring elástico anterior, cuyo rebote rompía la sensación luxury.
 */
const EASE_IN_OUT_PREMIUM: [number, number, number, number] = [0.65, 0, 0.35, 1];

// ─── Variantes de animación ───────────────────────────────────────────────────

/**
 * Animación de entrada y salida del panel completo.
 *
 * Combina opacidad con un descenso sutil de 6px: el panel "desciende desde
 * la barra" en lugar de simplemente parpadear. 420ms es deliberadamente
 * generoso — cualquier valor por debajo de 350ms se siente apresurado en
 * contexto luxury.
 */
const panelVariants: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE_OUT_PREMIUM },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.22, ease: EASE_IN_OUT_PREMIUM },
  },
};

/** Variante sin movimiento para `prefers-reduced-motion`. */
const panelVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/**
 * Stagger de opacidad de cada subcategoría.
 *
 * Sin movimiento (ni vertical ni horizontal): los items aparecen en cascada
 * pero sin desplazamiento, lo que evita la sensación de "ráfaga" típica
 * de dropdowns funcionales y refuerza la calma editorial del panel.
 */
const subItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.32,
      ease: EASE_OUT_PREMIUM,
    },
  }),
};

/** Stagger reducido para `prefers-reduced-motion`. */
const subItemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.02, duration: 0.1 },
  }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Desplaza suavemente la ventana hasta el elemento indicado, compensando
 * el offset acumulado de todas las barras fijas superiores para que el
 * título de la sección no quede oculto bajo ellas.
 *
 * Offset total = announcement-height + navbar-height + esta barra + 16px margen.
 *
 * @param id - Valor del atributo `id` del elemento destino en el DOM.
 */
const scrollToSection = (id: string): void => {
  const el = document.getElementById(id);
  if (!el) return;

  const style = getComputedStyle(document.documentElement);
  const announcementPx =
    parseFloat(style.getPropertyValue('--announcement-height')) || 36;
  const navbarPx = parseFloat(style.getPropertyValue('--navbar-height')) || 64;
  const offset = announcementPx + navbarPx + NAV_BAR_HEIGHT + 16;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top, behavior: 'smooth' });
};

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Barra de navegación rápida al catálogo — estilo luxury/editorial.
 *
 * Estructura de tres zonas:
 * 1. "CATÁLOGO" (izquierda)  → limpia filtros y navega a /catalogo.
 * 2. Categorías raíz (centro) → panel de subcategorías al hover.
 * 3. "SERVICIOS" (derecha)   → scroll suave hasta `#servicios`.
 *
 * Siempre debe ir acompañada de `<CatalogNavBarSpacer />` inmediatamente
 * después para que la barra fija no tape el primer elemento de la página.
 */
export const CatalogNavBar = () => {
  const {
    categories,
    loadCategories,
    selectCatalogCategory,
    selectCatalogSubCategory,
  } = useCategoryStore();

  const navigate = useNavigate();

  /**
   * ID de la categoría cuyo panel está actualmente abierto.
   * `null` = ningún panel visible.
   */
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Carga categorías una vez al montar. El store previene peticiones duplicadas.
  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // Solo nivel raíz — las subcategorías viven en category.children.
  const rootCategories = categories.filter((cat) => cat.parentId === null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Limpia todos los filtros activos y navega al catálogo completo. */
  const handleGoToCatalog = () => {
    selectCatalogCategory(null);
    selectCatalogSubCategory(null);
    navigate('/catalogo');
  };

  /**
   * Selecciona una categoría raíz y navega al catálogo filtrado.
   * @param categoryId - ID de la categoría raíz seleccionada.
   */
  const handleSelectCategory = (categoryId: number) => {
    selectCatalogCategory(categoryId);
    selectCatalogSubCategory(null);
    setActiveDropdown(null);
    navigate('/catalogo');
  };

  /**
   * Selecciona una subcategoría con su padre y navega al catálogo filtrado.
   * @param parentId      - ID de la categoría raíz contenedora.
   * @param subCategoryId - ID de la subcategoría elegida.
   */
  const handleSelectSubCategory = (parentId: number, subCategoryId: number) => {
    selectCatalogCategory(parentId);
    selectCatalogSubCategory(subCategoryId);
    setActiveDropdown(null);
    navigate('/catalogo');
  };

  return (
    /*
     * `hidden lg:block`: la barra rápida es exclusiva de desktop.
     * En móvil/tablet, los accesos a catálogo/categorías y a la sección
     * de servicios se entregan a través del menú hamburguesa del navbar
     * principal, que es más usable sin hover y consistente con el patrón
     * de navegación del sitio en pantallas pequeñas.
     */
    <nav
      aria-label="Navegación rápida al catálogo"
      className="hidden w-full border-b lg:block"
      style={{
        /*
         * position: fixed — necesario porque MainLayout tiene overflow-hidden,
         * lo que invalida sticky en todos sus descendientes.
         *
         * top — apila esta barra exactamente donde termina el navbar.
         *
         * z-index: 39 — sobre el contenido de página,
         * bajo el navbar principal (z-40) y los overlays/modales (z-50).
         */
        position: 'fixed',
        top: 'calc(var(--announcement-height) + var(--navbar-height))',
        left: 0,
        right: 0,
        zIndex: 39,
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        className="mx-auto flex items-stretch px-4 sm:px-6 lg:px-10"
        style={{
          maxWidth: 'var(--content-max-width)',
          height: `${NAV_BAR_HEIGHT}px`,
        }}
      >
        {/* ── Acceso al catálogo completo ─────────────────────────────────── */}
        <NavBarEdgeButton
          onClick={handleGoToCatalog}
          bold
          aria-label="Ver todo el catálogo"
        >
          Catálogo
        </NavBarEdgeButton>

        <Divider />

        {/* ── Categorías raíz con paneles de subcategorías ─────────────────
         *
         * Sin overflow-x-auto: con 5-7 categorías máximo no hay riesgo de
         * desbordamiento y el scroll horizontal es incómodo e inesperado.
         */}
        <div className="flex flex-1 items-stretch">
          {rootCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isOpen={activeDropdown === category.id}
              onOpen={() => setActiveDropdown(category.id)}
              onClose={() => setActiveDropdown(null)}
              onSelectCategory={handleSelectCategory}
              onSelectSubCategory={handleSelectSubCategory}
            />
          ))}
        </div>

        <Divider />

        {/* ── Acceso a la sección de servicios ────────────────────────────── */}
        <NavBarEdgeButton
          onClick={() => scrollToSection('servicios')}
          aria-label="Ir a la sección de servicios"
        >
          Servicios
        </NavBarEdgeButton>
      </div>
    </nav>
  );
};

// ─── Spacer ───────────────────────────────────────────────────────────────────

/**
 * Reserva en el flujo del documento el espacio que ocupa `CatalogNavBar`.
 *
 * Como la barra usa `position: fixed`, sale del flujo normal. Este div de
 * altura equivalente empuja el contenido siguiente hacia abajo la misma
 * distancia, evitando que la barra fija tape el primer elemento de la página.
 *
 * Debe montarse **inmediatamente después** de `<CatalogNavBar />`.
 *
 * `hidden lg:block` — debe acompañar al breakpoint de la propia barra:
 * en móvil/tablet la barra no se renderiza, por lo que el spacer tampoco
 * debe reservar espacio (de lo contrario quedaría un hueco vacío de 48px
 * justo bajo el navbar principal).
 */
export const CatalogNavBarSpacer = () => (
  <div
    aria-hidden="true"
    className="hidden lg:block"
    style={{ height: `${NAV_BAR_HEIGHT}px`, flexShrink: 0 }}
  />
);

// ─── Divisor vertical ─────────────────────────────────────────────────────────

/**
 * Línea divisora vertical entre las zonas de la barra.
 * El margen vertical (my-3.5) la acorta respecto a la altura total,
 * evitando que parezca el borde de una celda de tabla.
 */
const Divider = () => (
  <div
    className="my-3.5 w-px shrink-0 self-stretch"
    style={{ backgroundColor: 'var(--border-color)' }}
    aria-hidden="true"
  />
);

// ─── Botón de borde (Catálogo / Servicios) ────────────────────────────────────

interface NavBarEdgeButtonProps {
  /** Texto visible del botón. */
  children: React.ReactNode;
  /** Acción ejecutada al hacer click. */
  onClick: () => void;
  /**
   * Aplica `font-semibold` al texto (vs. `font-medium` por defecto).
   * Reservado para "CATÁLOGO" como anclaje principal de navegación.
   */
  bold?: boolean;
  /** Descripción accesible para tecnologías de asistencia. */
  'aria-label'?: string;
}

/**
 * Botón de los extremos de la barra ("CATÁLOGO" y "SERVICIOS").
 *
 * Tipografía uppercase + tracking widest coherente con la identidad luxury.
 *
 * ── Indicador de hover: línea inferior expansiva ─────────────────────────────
 * Una línea de 2px en `--text-accent` aparece pegada al borde inferior del
 * botón (con 6px de separación del border-b del nav). Crece desde el centro
 * hacia los extremos (`scaleX(0) → scaleX(1)`) en 450ms con curva premium —
 * efecto simétrico y editorial, inspirado en navegaciones de Hermès y Loewe.
 *
 * ── Por qué `useState` + transform inline en vez de `group-hover` ────────────
 * Tailwind 4 implementa los utilitarios de escala (`scale-x-0`, `scale-x-100`)
 * usando la propiedad CSS nativa `scale`, no `transform`. Si declaras
 * `transition: transform`, la transición no captura los cambios de `scale`
 * y la línea aparece instantáneamente sin animación.
 *
 * Solución: rastrear el hover con `useState` y aplicar `transform: scaleX()`
 * directamente como inline style. La transición sobre `transform` ahora sí
 * encuentra la propiedad correcta y anima de forma garantizada en cualquier
 * versión de Tailwind.
 *
 * ── Item visualmente fijo ────────────────────────────────────────────────────
 * Sin atenuación de opacidad ni cambio de font-weight en hover: el texto
 * permanece estático y solo la línea inferior responde. Cualquier variación
 * tipográfica se percibe como un micro-desplazamiento ("lift") que rompe la
 * sensación luxury.
 */
const NavBarEdgeButton = ({
  children,
  onClick,
  bold = false,
  'aria-label': ariaLabel,
}: NavBarEdgeButtonProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={ariaLabel}
      className="relative flex cursor-pointer items-center px-5 sm:px-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
      style={{ background: 'none', border: 'none' }}
    >
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          fontWeight: bold ? 'var(--font-semibold)' : 'var(--font-medium)',
          letterSpacing: 'var(--tracking-widest)',
          textTransform: 'uppercase',
          color: 'var(--text-accent)',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>

      {/*
       * Línea inferior — animación garantizada por transform inline.
       * scaleX(0) en reposo (invisible pero ocupando ancho completo, sin
       * layout shift), scaleX(1) en hover. transformOrigin centrado para
       * crecimiento bidireccional desde el centro hacia los extremos.
       */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '6px',
          left: 0,
          width: '100%',
          height: '2px',
          backgroundColor: 'var(--text-accent)',
          transformOrigin: 'center',
          transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </button>
  );
};

// ─── Ítem de categoría con panel luxury ───────────────────────────────────────

interface CategoryItemProps {
  /**
   * Categoría raíz a renderizar.
   * Sus hijos (`category.children`) son las subcategorías del panel.
   */
  category: Category;
  /** Indica si el panel de esta categoría está actualmente visible. */
  isOpen: boolean;
  /** Abre el panel — se invoca en `onMouseEnter` del contenedor. */
  onOpen: () => void;
  /** Cierra el panel — se invoca en `onMouseLeave` y click fuera. */
  onClose: () => void;
  /** Navega al catálogo filtrado por esta categoría raíz. */
  onSelectCategory: (id: number) => void;
  /** Navega al catálogo filtrado por esta subcategoría específica. */
  onSelectSubCategory: (parentId: number, subId: number) => void;
}

/**
 * Ítem de categoría raíz con panel luxury de subcategorías.
 *
 * ── Estado activo del botón ──────────────────────────────────────────────────
 * Cuando el panel está abierto, el botón recibe DOS señales visuales:
 * · Línea inferior permanente a scaleX(1) — el mismo indicador del hover,
 *   pero anclada en posición expandida (no condicional al cursor).
 * · Chevron a 180° con easing simétrico (sin overshoot/rebote).
 *
 * Tipografía constante (medium siempre): el ítem nunca cambia de peso para
 * evitar el ensanchamiento sutil de los caracteres, que se percibe como
 * "elevación" del texto. Toda la diferenciación visual va a la línea.
 *
 * ── Sin título redundante ────────────────────────────────────────────────────
 * El nombre de la categoría ya es visible en la barra de navegación.
 * Repetirlo como encabezado dentro del panel genera jerarquía innecesaria
 * y ocupa espacio que corresponde a las subcategorías.
 *
 * ── Panel claro y editorial ──────────────────────────────────────────────────
 * `minWidth: PANEL_MIN_WIDTH_PX` (380px) garantiza que ningún ítem se sienta
 * comprimido y que haya aire suficiente para el arrow lateral en hover.
 *
 * ── Continuidad de hover (sin paddingBottom) ────────────────────────────────
 * El panel se posiciona con `top: 100%` del contenedor, pegado al borde
 * inferior del botón sin gap. Como el panel es descendiente DOM del
 * contenedor con `onMouseLeave`, mover el cursor del botón al panel no
 * dispara `onMouseLeave` (mouseleave no se activa entre descendientes).
 * No se necesita `paddingBottom` artificial — y eliminarlo corrige la
 * elevación que producía al encoger la altura útil del botón.
 *
 * ── Cierre por click fuera ───────────────────────────────────────────────────
 * Listener en `document` activo solo cuando el panel está abierto.
 * Se elimina automáticamente en el return del efecto.
 */
const CategoryItem = ({
  category,
  isOpen,
  onOpen,
  onClose,
  onSelectCategory,
  onSelectSubCategory,
}: CategoryItemProps) => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const subCategories = category.children ?? [];
  const hasSubCategories = subCategories.length > 0;

  // Cierre al hacer click fuera del contenedor completo (botón + panel).
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const resolvedPanelVariants = shouldReduceMotion
    ? panelVariantsReduced
    : panelVariants;

  const resolvedSubItemVariants = shouldReduceMotion
    ? subItemVariantsReduced
    : subItemVariants;

  return (
    /*
     * Sin paddingBottom: el panel a `top: 100%` ya hace de bridge sin
     * alterar la altura del botón ni desplazar verticalmente el texto.
     */
    <div
      ref={containerRef}
      className="relative flex items-stretch"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      {/* ── Botón de la categoría raíz ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onSelectCategory(category.id)}
        aria-haspopup={hasSubCategories ? 'listbox' : undefined}
        aria-expanded={hasSubCategories ? isOpen : undefined}
        className="relative flex cursor-pointer items-center gap-2 px-5 sm:px-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
        style={{ background: 'none', border: 'none' }}
      >
        {/*
         * Nombre de la categoría — completamente estático.
         *
         * Sin cambios de opacidad ni de font-weight entre reposo y activo.
         * Mantener `--font-medium` constante evita el ensanchamiento sutil
         * de los caracteres al pasar a semibold (causa real de la sensación
         * de "elevación" que se percibía al hacer hover). Toda la señal
         * visual de estado va en la línea inferior expansiva.
         */}
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-medium)',
            letterSpacing: 'var(--tracking-widest)',
            textTransform: 'uppercase',
            color: 'var(--text-accent)',
            whiteSpace: 'nowrap',
          }}
        >
          {category.name}
        </span>

        {/*
         * Chevron: easing simétrico (sin overshoot).
         * El spring elástico anterior rebotaba — un patrón "juguetón" que
         * rompe la sensación luxury. Curva easeInOut natural, 350ms.
         */}
        {hasSubCategories && (
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.35, ease: EASE_IN_OUT_PREMIUM }}
            style={{ display: 'flex', flexShrink: 0 }}
            aria-hidden="true"
          >
            <ChevronDown
              size={11}
              strokeWidth={1.75}
              style={{ color: 'var(--text-accent)' }}
            />
          </motion.span>
        )}

        {/*
         * Línea inferior — indicador unificado para hover y estado activo.
         *
         * Aquí basta con `isOpen` porque hover sobre el contenedor invoca
         * `onOpen` inmediatamente: el item siempre se abre cuando se hace
         * hover. No hay diferencia entre "hovered" y "isOpen" en este
         * componente, así que un único estado controla la línea.
         *
         * · Posición : `bottom: 6px` la separa del border-b del nav.
         * · Grosor   : 2px — visible sin ser pesada.
         * · Animación: scaleX(0) → scaleX(1) en 450ms con curva premium,
         *   declarada en transform inline para garantizar el animado en
         *   cualquier versión de Tailwind (Tailwind 4 usa `scale` CSS,
         *   no `transform`, lo que rompía las clases utilitarias previas).
         * · Origen   : `center` → crecimiento bidireccional simétrico.
         */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '6px',
            left: 0,
            width: '100%',
            height: '2px',
            backgroundColor: 'var(--text-accent)',
            transformOrigin: 'center',
            transform: isOpen ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </button>

      {/* ── Panel luxury de subcategorías ──────────────────────────────────
       *
       * Solo se monta si la categoría tiene hijos.
       * `AnimatePresence` gestiona la animación de salida antes del desmontaje.
       *
       * Posicionamiento:
       * · `position: absolute`  → flota sobre el contenido de la página.
       * · `top: 100%`           → arranca al final del contenedor (incluye el
       *                          HOVER_BRIDGE_PX de paddingBottom cuando abierto).
       * · `left: 0`             → alineado con el borde izquierdo del botón.
       * · `z-index: 50`         → sobre todo el contenido y la barra (z-39).
       *
       * Estilo:
       * · Fondo `--bg-secondary`  → blanco en light, gris elevado en dark.
       * · Borde `--border-color`  → solo lados y abajo (no top, sería redundante
       *                            con el border-b de la barra).
       * · Sombra `--shadow-lg`    → elevación visible pero no agresiva.
       * · Radius solo en esquinas inferiores → refuerza que el panel es una
       *                                       extensión natural de la barra.
       */}
      {hasSubCategories && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              role="listbox"
              aria-label={`Subcategorías de ${category.name}`}
              variants={resolvedPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute z-50"
              style={{
                top: '100%',
                left: 0,
                minWidth: `${PANEL_MIN_WIDTH_PX}px`,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderTop: 'none',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              {/*
               * Lista de subcategorías — sin separadores entre items.
               * El hover (background tintado + trazo izquierdo + arrow)
               * marca cada item con suficiente claridad. Los separadores
               * horizontales fragmentan visualmente y se leen como UI
               * funcional, no editorial.
               *
               * Padding vertical del contenedor: 8px arriba y abajo da
               * respiro al bloque sin desperdiciar altura.
               */}
              <ul
                role="presentation"
                style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}
              >
                {subCategories.map((sub, i) => (
                  <motion.li
                    key={sub.id}
                    role="presentation"
                    custom={i}
                    variants={resolvedSubItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <SubCategoryButton
                      label={sub.name}
                      onClick={() => onSelectSubCategory(category.id, sub.id)}
                    />
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

// ─── Botón de subcategoría ────────────────────────────────────────────────────

interface SubCategoryButtonProps {
  /** Nombre de la subcategoría que se muestra en el ítem. */
  label: string;
  /** Callback que navega al catálogo filtrado por esta subcategoría. */
  onClick: () => void;
}

/**
 * Botón de subcategoría dentro del panel luxury.
 *
 * Gestiona su propio estado `hovered` con `useState` para mantener el código
 * idiomático de React, en lugar de manipular el DOM directamente.
 *
 * ── Anatomía del ítem ────────────────────────────────────────────────────────
 * Layout: `justify-between` con label a la izquierda y arrow `→` a la derecha.
 * El arrow solo se materializa en hover (opacidad 0→1 + translateX -6px → 0).
 *
 * · Padding vertical generoso (14px): cada ítem "respira" — sensación premium.
 * · Padding horizontal: 28px derecha, 26px izquierda (28 - 2px del trazo).
 *   Asimetría calculada para que el texto no se desplace al aparecer el trazo.
 * · Tipografía: `--text-sm` (más grande que la barra) + `--tracking-wide`
 *   (menos agresivo que el `tracking-widest` de arriba). Sin `text-transform`:
 *   se respeta la capitalización natural del backend, que es más editorial
 *   que el uppercase forzado del menú anterior.
 *
 * ── Indicadores de hover ─────────────────────────────────────────────────────
 * Tres señales visuales superpuestas que actúan en conjunto:
 *
 * 1. **Background tintado** — `--bg-hover` (rgba navy con baja opacidad).
 *    Adapta automáticamente entre light (6% opacidad) y dark (18% opacidad).
 *
 * 2. **Trazo izquierdo de 2px** — `--text-accent` (navy en light, blanco
 *    en dark). En reposo es transparente pero ocupa el mismo espacio para
 *    evitar layout shift. Inspirado en navegaciones de Cartier, Boucheron.
 *
 * 3. **Arrow `→` deslizándose** — entra desde la izquierda con curva premium.
 *    Refuerza la affordance "click me" sin ocupar espacio en reposo.
 *
 * ── Tipografía en hover ──────────────────────────────────────────────────────
 * El texto sube de `--text-secondary` a `--text-primary` y de `--font-medium`
 * a `--font-semibold`. Refuerzo tipográfico sutil que confirma la selección
 * sin gritar. Las transiciones de color usan 250ms para sensación suave.
 */
const SubCategoryButton = ({ label, onClick }: SubCategoryButtonProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      role="option"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex w-full cursor-pointer items-center justify-between text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--accent)"
      style={{
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        border: 'none',
        /*
         * Trazo izquierdo como indicador de hover. En reposo es transparente
         * pero presente (mantiene el ancho), evitando layout shift al activar.
         */
        borderLeft: `2px solid ${hovered ? 'var(--text-accent)' : 'transparent'}`,
        /*
         * paddingLeft 26px = 28px - 2px del trazo. Garantiza que el texto
         * permanezca en la misma X al aparecer el borde lateral.
         */
        padding: '14px 28px 14px 26px',
        transition:
          'background-color 250ms ease, border-color 250ms ease',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          /*
           * Refuerzo tipográfico en hover: medium → semibold.
           * Cambio inmediato (font-weight no es interpolable en CSS).
           */
          fontWeight: hovered ? 'var(--font-semibold)' : 'var(--font-medium)',
          letterSpacing: 'var(--tracking-wide)',
          color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          transition: 'color 250ms ease',
        }}
      >
        {label}
      </span>

      {/*
       * Arrow indicador — entra desde la izquierda en hover.
       * · Reposo: opacidad 0 + translateX(-6px) — invisible, fuera de posición.
       * · Hover : opacidad 1 + translateX(0)   — visible, en posición final.
       * El transform usa la curva premium para deslizamiento elegante;
       * la opacidad usa easing estándar (no necesita refinamiento extra).
       */}
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-accent)',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition:
            'opacity 250ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          lineHeight: 1,
          flexShrink: 0,
          marginLeft: '24px',
        }}
        aria-hidden="true"
      >
        →
      </span>
    </button>
  );
};
