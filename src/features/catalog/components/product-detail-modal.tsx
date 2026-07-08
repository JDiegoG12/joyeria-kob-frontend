/**
 * @file product-detail-modal.tsx
 * @description Modal de detalle de producto del catálogo público de Joyería KOB.
 *
 * El contenido visual (galería + info + lightbox) vive en
 * `ProductDetailContent`, compartido con la página `/producto/:slug`. Este
 * archivo aporta únicamente el "chrome" del modal: portal, overlay, panel
 * animado y botón de cerrar. Así el modal y la página renderizan exactamente la
 * misma UI sin duplicarla.
 *
 *  NOTAS DE DISEÑO (UX/UI) — se conservan del diseño original:
 * 1. Bordes Cuadrados para mayor elegancia.
 * 2. Scroll Aislado (Desktop): la columna de info hace scroll, el título/precio
 *    quedan fijos (lo gestiona `ProductDetailContent` con `layout="modal"`).
 * 3. Experiencia móvil: el modal completo hace scroll fluido.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { X } from 'lucide-react';
import type { Product } from '@/features/catalog/types/product.types';
import { ProductDetailContent } from './product-detail-content';

// ─── Tipos y Animaciones ─────────────────────────────────────────────────────

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ─── Componente Principal ────────────────────────────────────────────────────

export const ProductDetailModal = ({
  product,
  onClose,
}: ProductDetailModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquea el scroll del body mientras el modal está abierto. Los atajos de
  // teclado (←/→/Esc) los gestiona `ProductDetailContent` en `layout="modal"`.
  useEffect(() => {
    if (!product) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {product && (
        <motion.div
          key="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[9999] overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex min-h-full p-2 sm:p-6 md:p-8">
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative m-auto flex min-h-full w-full max-w-[64rem] flex-col overflow-y-auto shadow-2xl sm:min-h-0 sm:max-h-[88vh] sm:flex-row sm:overflow-hidden bg-[var(--bg-secondary)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cerrar — icono flotante sin caja. */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 z-30 flex h-10 w-10 cursor-pointer items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] transition-opacity duration-150 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-3 sm:top-3 sm:text-[var(--text-primary)] sm:drop-shadow-none sm:focus-visible:outline-[var(--accent)]"
                aria-label="Cerrar detalles"
              >
                <X size={22} strokeWidth={2} />
              </button>

              <ProductDetailContent
                product={product}
                layout="modal"
                onClose={onClose}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
