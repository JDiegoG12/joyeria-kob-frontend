/**
 * @file catalog-nav-bar.tsx
 * @description Barra de navegación rápida al catálogo — estética luxury/minimalista.
 *
 * ─── Posicionamiento ──────────────────────────────────────────────────────────
 * La barra usa `position: fixed` porque el contenedor raíz de `MainLayout`
 * tiene `overflow-hidden`, lo que invalida `position: sticky` en cualquier
 * descendiente. Se apila justo debajo del navbar principal:
 *
 * top = --announcement-height + --navbar-height
 *
 * El contenido de la página se desplaza hacia abajo con `<CatalogNavBarSpacer>`,
 * que debe montarse inmediatamente después de `<CatalogNavBar />`.
 *
 * ─── Layout de la barra ───────────────────────────────────────────────────────
 * · Izquierda : "CATÁLOGO" → /catalogo limpiando todos los filtros activos.
 * · Centro    : categorías raíz. Al hover aparece el panel de subcategorías.
 * · Derecha   : "SERVICIOS" → scroll suave hasta el elemento `#servicios`.
 *
 * ─── Panel de subcategorías (luxury) ─────────────────────────────────────────
 * Diseño inspirado en ecommerce de moda/joyería premium:
 *
 * · Fondo anclado a `var(--accent)` (azul marino de marca), independiente del tema.
 * — En modo claro: contrasta nítidamente con la barra blanca y el contenido.
 * — En modo oscuro: `var(--accent)` ≠ `var(--bg-primary)`, el panel sigue
 * siendo perceptible sin necesitar tokens semánticos adicionales.
 *
 * · Sin título redundante. La categoría activa ya es visible en la barra;
 * repetirla como encabezado dentro del panel genera ruido visual innecesario.
 *
 * · El panel nace directamente de la barra: `top: 100%` sin marginTop negativo.
 * La zona muerta anti-gap (hover bridge) se implementa con `paddingBottom`
 * en el contenedor del ítem — ver sección siguiente.
 *
 * ─── Técnica anti-gap (hover bridge) ─────────────────────────────────────────
 * Cuando el panel está abierto, el contenedor del ítem recibe
 * `paddingBottom: HOVER_BRIDGE_PX`. Esta zona invisible "tiende un puente"
 * entre el borde inferior del botón y el borde superior del panel, impidiendo
 * que `onMouseLeave` se dispare cuando el cursor cruza ese espacio.
 *
 * A diferencia de implementaciones anteriores, el panel ya NO aplica
 * `marginTop` negativo. El panel arranca en `top: 100%` del contenedor
 * (que ya incluye el paddingBottom), por lo que visualmente nace pegado al
 * borde de la barra sin gap. El puente queda oculto detrás del panel.
 *
 * ─── Estado activo del ítem de la barra ──────────────────────────────────────
 * Cuando el panel de una categoría está abierto, su botón recibe:
 * · `font-weight: bold` (vs. semibold en reposo) — sutil pero perceptible.
 * · Opacidad 1 en el texto (sin la atenuación del hover normal).
 * · Línea inferior de 2px siempre visible (no solo en hover).
 * · Chevron rotado 180° con spring elástico y opacidad plena.
 *
 * ─── Animaciones ──────────────────────────────────────────────────────────────
 * · Panel     : fade suave con easing premium. Sin movimiento vertical para
 * preservar la ilusión de continuidad con la barra.
 * · Ítems     : stagger de opacidad escalonado. Sin movimiento horizontal
 * (el deslizamiento lateral es menos elegante en contexto luxury).
 * · Chevron   : spring elástico que transmite suavidad orgánica.
 * · Línea     : crece desde el centro (`origin-center`) para efecto simétrico.
 * · Respeta `prefers-reduced-motion` eliminando todos los desplazamientos.
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
 * Altura del puente invisible de hover en px.
 *
 * El contenedor del ítem recibe este `paddingBottom` cuando el panel está
 * abierto. Crea una zona invisible que conecta el botón con el panel,
 * evitando que `onMouseLeave` dispare al cruzar el espacio entre ambos.
 *
 * El panel arranca en `top: 100%` del contenedor (que ya incluye este padding),
 * por lo que visualmente queda pegado al borde inferior de la barra.
 */
const HOVER_BRIDGE_PX = 12;

// ─── Tokens de color del panel ────────────────────────────────────────────────
//
// Todos extraídos estrictamente de tokens.css.
// Se emplea color-mix() para calcular las opacidades directamente en CSS
// a partir de los tokens existentes, evitando colores hexadecimales o rgba quemados.

/** Azul marino de marca (idéntico en light y dark) — fondo del panel. */
const PANEL_BG = 'var(--accent)';

/**
 * Texto de subcategoría en reposo.
 * Se mezcla --accent-text (blanco) al 78% con transparente para emular rgba(255,255,255,0.78).
 */
const PANEL_TEXT = 'color-mix(in srgb, var(--accent-text) 78%, transparent)';

/** Texto de subcategoría en hover/focus — blanco puro extraído del token. */
const PANEL_TEXT_HOVER = 'var(--accent-text)';

/**
 * Separador entre ítems del panel.
 * Se mezcla al 7% para emular rgba(255,255,255,0.07).
 */
const PANEL_ITEM_BORDER =
  'color-mix(in srgb, var(--accent-text) 7%, transparent)';

/** Fondo del ítem en hover — mantiene la coherencia usando la mezcla al 7%. */
const PANEL_ITEM_HOVER_BG =
  'color-mix(in srgb, var(--accent-text) 7%, transparent)';

// ─── Variantes de animación ───────────────────────────────────────────────────

/**
 * Animación de entrada y salida del panel completo.
 *
 * Solo opacidad, sin movimiento vertical:
 * · El panel nace de la barra (no cae desde arriba), por lo que desplazarlo
 * verticalmente rompería la ilusión de continuity.
 * · `visible`: easing suave tipo `spring` — sensación premium, no robótica.
 * · `exit`   : fade rápido para no interrumpir el flujo si el usuario se mueve.
 */
const panelVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

/** Variante sin animación para `prefers-reduced-motion`. */
const panelVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};

/**
 * Stagger de opacidad de cada ítem de subcategoría.
 *
 * Sin movimiento horizontal: el deslizamiento lateral resta elegancia en
 * contextos luxury. La opacidad escalonada es más sutil y refinada.
 *
 * `custom` prop recibe el índice del ítem para calcular el delay escalonado.
 */
const subItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.045,
      duration: 0.24,
      ease: 'easeOut',
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
 * Barra de navegación rápida al catálogo — estilo luxury/minimalista.
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
    <nav
      aria-label="Navegación rápida al catálogo"
      className="w-full border-b"
      style={{
        /*
         * position: fixed — necesario porque MainLayout tiene overflow-hidden,
         * lo que invalida sticky en todos sus descendientes.
         *
         * top — apila esta barra exactamente donde termina el navbar.
         *
         * z-index: 39 — sobre el contenido de página,
         * bajo el navbar principal (z-40) y los overlays/modales (z-50).
         *
         * boxShadow mínimo en la barra usando el sistema de tokens.
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
 */
export const CatalogNavBarSpacer = () => (
  <div
    aria-hidden="true"
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
    className="my-3.5 w-px flex-shrink-0 self-stretch"
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
   * Aplica `font-bold` al texto.
   * Reservado para "CATÁLOGO" como anclaje principal de navegación.
   */
  bold?: boolean;
  /** Descripción accesible para tecnologías de asistencia. */
  'aria-label'?: string;
}

/**
 * Botón de los extremos de la barra ("CATÁLOGO" y "SERVICIOS").
 *
 * Tipografía uppercase + tracking amplio coherente con la identidad luxury.
 * El indicador de hover es una línea inferior que crece desde el centro
 * (`origin-center scaleX`) en lugar de desde la izquierda: efecto más
 * simétrico y elegante.
 *
 * La transición de opacidad usa 200ms (más lento que lo habitual) para
 * transmitir suavidad y no brusquedad.
 */
const NavBarEdgeButton = ({
  children,
  onClick,
  bold = false,
  'aria-label': ariaLabel,
}: NavBarEdgeButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="group relative flex cursor-pointer items-center px-5 sm:px-6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
    style={{ background: 'none', border: 'none' }}
  >
    <span
      className="transition-opacity duration-200 group-hover:opacity-55"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-xs)',
        fontWeight: bold ? 'var(--font-bold)' : 'var(--font-semibold)',
        letterSpacing: 'var(--tracking-widest)',
        textTransform: 'uppercase',
        color: 'var(--text-accent)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>

    {/*
     * Línea inferior que crece desde el centro en hover.
     * `origin-center` da un efecto simétrico más sofisticado que `origin-left`.
     * Duración 300ms: deliberadamente más lenta para sensación premium.
     */}
    <span
      className="absolute bottom-0 left-0 h-px w-full origin-center scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
      style={{ backgroundColor: 'var(--accent)' }}
      aria-hidden="true"
    />
  </button>
);

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
 * Cuando el panel está abierto, el botón recibe señales visuales diferenciadas:
 * · `font-weight: bold` en lugar de semibold — refuerzo sutil pero efectivo.
 * · Opacidad 1 sin atenuación (contrariamente al hover normal que baja a 0.55).
 * · Línea inferior de 2px permanente (no condicional al hover).
 * · Chevron a 180° con spring elástico, opacidad plena.
 *
 * ── Sin título redundante ────────────────────────────────────────────────────
 * El nombre de la categoría ya es visible en la barra de navegación.
 * Repetirlo como encabezado dentro del panel genera jerarquía innecesaria
 * y ocupa espacio que corresponde a las subcategorías.
 *
 * ── Panel ancho y espacioso ──────────────────────────────────────────────────
 * `minWidth: 260px` garantiza que ningún ítem se sienta comprimido.
 * El padding por ítem (14px vertical) es generoso para transmitir premium.
 *
 * ── Anti-gap (hover bridge) ──────────────────────────────────────────────────
 * Ver sección "Técnica anti-gap" en el JSDoc del archivo para la explicación
 * completa. El panel NO usa marginTop negativo; el paddingBottom del contenedor
 * actúa como puente invisible.
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
     * paddingBottom activo = puente invisible de hover.
     * El panel arranca en top:100% de este contenedor (que incluye el padding),
     * por lo que visualmente nace pegado al borde inferior de la barra sin gap.
     * Ver "Técnica anti-gap" en el JSDoc del archivo.
     */
    <div
      ref={containerRef}
      className="relative flex items-stretch"
      style={{ paddingBottom: isOpen ? `${HOVER_BRIDGE_PX}px` : '0' }}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      {/* ── Botón de la categoría raíz ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onSelectCategory(category.id)}
        aria-haspopup={hasSubCategories ? 'listbox' : undefined}
        aria-expanded={hasSubCategories ? isOpen : undefined}
        className="group relative flex cursor-pointer items-center gap-1.5 px-4 sm:px-5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
        style={{ background: 'none', border: 'none' }}
      >
        {/* Nombre de la categoría */}
        <span
          className={
            /*
             * Estado activo (isOpen): sin grupo-hover, opacidad plena.
             * Estado reposo: baja a 0.55 en hover para señalar interactividad.
             */
            isOpen
              ? undefined
              : 'transition-opacity duration-200 group-hover:opacity-55'
          }
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            /*
             * Bold cuando está activo: diferencia perceptible sin ser gritona.
             * No animar font-weight (no interpolable en CSS); el cambio es inmediato.
             */
            fontWeight: isOpen ? 'var(--font-bold)' : 'var(--font-semibold)',
            letterSpacing: 'var(--tracking-widest)',
            textTransform: 'uppercase',
            color: 'var(--text-accent)',
            whiteSpace: 'nowrap',
          }}
        >
          {category.name}
        </span>

        {/*
         * Chevron: spring elástico al abrir/cerrar.
         * La opacidad plena en estado activo refuerza la señal visual.
         */}
        {hasSubCategories && (
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              display: 'flex',
              flexShrink: 0,
              opacity: isOpen ? 1 : 0.55,
              transition: 'opacity 200ms ease',
            }}
            aria-hidden="true"
          >
            <ChevronDown
              size={10}
              strokeWidth={2}
              style={{ color: 'var(--text-accent)' }}
            />
          </motion.span>
        )}

        {/*
         * Indicador de estado activo — línea inferior de 2px.
         * · Abierto : permanente, escala completa.
         * · Reposo  : aparece solo en hover, crece desde el centro (simétrico).
         * Duración más lenta (300ms) para sensación premium.
         */}
        <span
          className={`absolute bottom-0 left-0 h-0.5 w-full origin-center transition-transform ease-out ${
            isOpen
              ? 'scale-x-100 duration-200'
              : 'scale-x-0 duration-300 group-hover:scale-x-100'
          }`}
          style={{ backgroundColor: 'var(--accent)' }}
          aria-hidden="true"
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
       * HOVER_BRIDGE_PX de paddingBottom cuando abierto).
       * · `left: 0`             → alineado con el borde izquierdo del botón.
       * · `z-index: 50`         → sobre todo el contenido y la barra (z-39).
       * · Sin marginTop negativo: el panel nace de la barra sin gap artificial.
       *
       * Sombra y radio se aplican mediante tokens.
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
                minWidth: '260px',
                /* Configuración de UI extraída íntegramente de tokens.css */
                backgroundColor: PANEL_BG,
                boxShadow: 'var(--shadow-xl)',
                borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              {/*
               * Lista de subcategorías — sin encabezado con el nombre de la categoría.
               * El ítem activo ya es visible en la barra; repetirlo añade ruido.
               * El padding superior e inferior del contenedor da respiro al bloque.
               */}
              <ul
                role="presentation"
                style={{ listStyle: 'none', margin: 0, padding: '8px 0 10px' }}
              >
                {subCategories.map((sub, i) => (
                  <motion.li
                    key={sub.id}
                    role="presentation"
                    custom={i}
                    variants={resolvedSubItemVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                      /*
                       * Separador entre ítems — muy sutil para no fragmentar
                       * visualmente el panel; solo orienta sin interrumpir.
                       * El último ítem no lleva separador.
                       */
                      borderBottom:
                        i < subCategories.length - 1
                          ? `1px solid ${PANEL_ITEM_BORDER}`
                          : 'none',
                    }}
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
 * · Padding vertical generoso (14px): cada ítem "respira" — sensación premium.
 * · Tipografía uppercase + tracking amplio, consistente con la barra superior.
 * · Indicador de hover: trazo izquierdo de 3px usando color-mix de var(--accent-text).
 * Aparece solo en hover; en reposo ocupa el mismo espacio pero transparente
 * para evitar que el texto salte al aparecer el borde (layout shift).
 * · Color de texto que transiciona suavemente a blanco puro en hover.
 * · `font-weight` sube a semibold en hover para un refuerzo tipográfico sutil.
 *
 * ── Por qué un trazo izquierdo y no una flecha ───────────────────────────────
 * La flecha `›` (implementación anterior) añadía un carácter extra que
 * fragmenta la lectura. El trazo izquierdo, inspirado en las navegaciones de
 * casas de moda de lujo (Cartier, Tiffany, Boucheron), es más elegante y
 * tipográficamente limpio.
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
      className="flex w-full cursor-pointer items-center text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent-text)]"
      style={{
        background: hovered ? PANEL_ITEM_HOVER_BG : 'transparent',
        border: 'none',
        /*
         * Trazo izquierdo como indicador de hover extrayendo alfa del token maestro.
         * En reposo: transparente pero presente (evita layout shift).
         * En hover : usa color-mix para la opacidad (no color sólido puro).
         */
        borderLeft: `3px solid ${hovered ? 'color-mix(in srgb, var(--accent-text) 32%, transparent)' : 'transparent'}`,
        /*
         * paddingLeft: 17px = 20px - 3px del borde,
         * para que el texto no se desplace al aparecer el trazo.
         */
        padding: '14px 24px 14px 17px',
        transition: 'background-color 200ms ease, border-color 200ms ease',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          fontWeight: hovered ? 'var(--font-semibold)' : 'var(--font-medium)',
          letterSpacing: 'var(--tracking-widest)',
          textTransform: 'uppercase',
          color: hovered ? PANEL_TEXT_HOVER : PANEL_TEXT,
          whiteSpace: 'nowrap',
          transition: 'color 200ms ease',
        }}
      >
        {label}
      </span>
    </button>
  );
};
