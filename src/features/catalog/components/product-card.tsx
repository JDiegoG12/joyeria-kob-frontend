import type { Product } from '../types/product.types';

interface ProductCardProps {
  product: Product;
  serverUrl: string;
  isProcessing: boolean;
  onEdit: (product: Product) => void;
  onToggleVisibility: (product: Product) => void;
}

export const ProductCard = ({
  product,
  serverUrl,
  isProcessing,
  onEdit,
  onToggleVisibility,
}: ProductCardProps) => {
  const mainImage = product.images?.[0];

  const getStatusLabel = (status: Product['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Activo';
      case 'OUT_OF_STOCK':
        return 'Sin stock';
      case 'HIDDEN':
        return 'Oculto';
      default:
        return status;
    }
  };

  const getStatusClasses = (status: Product['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'OUT_OF_STOCK':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'HIDDEN':
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-md transition duration-300 hover:shadow-lg">
      <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
        {mainImage ? (
          <img
            src={`${serverUrl}/uploads/products/${mainImage}`}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-[var(--text-muted)]">
            Sin imagen
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold">{product.name}</h3>

      <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
        {product.description}
      </p>

      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Peso base: {product.baseWeight} g
      </p>

      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Stock: {product.stock}
      </p>

      <p className="mt-3 text-xl font-semibold text-[var(--accent)]">
        ${product.calculatedPrice.toLocaleString('es-CO')}
      </p>

      <span
        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${getStatusClasses(product.status)}`}
      >
        {getStatusLabel(product.status)}
      </span>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 rounded-xl bg-[var(--accent)] py-2 text-white transition hover:opacity-90"
        >
          Editar
        </button>

        <button
          onClick={() => onToggleVisibility(product)}
          disabled={isProcessing}
          className="flex-1 rounded-xl border border-[var(--border-color)] py-2 transition hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing
            ? 'Procesando...'
            : product.status === 'HIDDEN'
              ? 'Activar'
              : 'Ocultar'}
        </button>
      </div>
    </div>
  );
};