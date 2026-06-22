/**
 * @file product-card-skeleton.tsx
 * @description Esqueleto de carga de una tarjeta de producto. Replica la
 * silueta de `PublicProductCard` (imagen cuadrada + separador + dos líneas de
 * texto) para reservar espacio y evitar saltos de layout mientras llega la
 * respuesta del backend.
 *
 * Centraliza el marcado que antes estaba duplicado en el grid del catálogo y en
 * la sección de relacionados. El llamador aporta su propia grilla; este
 * componente es una sola celda.
 */

interface ProductCardSkeletonProps {
  /**
   * Retardo de la animación de pulso, en ms. Permite un efecto escalonado
   * cuando se renderizan varias en grilla.
   */
  delayMs?: number;
}

/** Una celda de esqueleto con la silueta de la tarjeta de producto. */
export const ProductCardSkeleton = ({ delayMs = 0 }: ProductCardSkeletonProps) => (
  <div
    className="animate-pulse border"
    style={{
      borderColor: 'var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      animationDelay: `${delayMs}ms`,
    }}
  >
    <div
      className="aspect-square w-full"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />
    <div
      className="h-px w-full"
      style={{ backgroundColor: 'var(--border-color)' }}
    />
    <div className="px-3 pb-4 pt-3 text-center">
      <div
        className="mx-auto h-3 w-3/4 rounded"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
      <div
        className="mx-auto mt-2 h-3 w-1/2 rounded"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      />
    </div>
  </div>
);
