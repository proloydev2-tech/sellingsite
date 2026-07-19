import type { Product, Variant } from '../lib/supabase';
import ProductCard from './ProductCard';

type Props = {
  products: Product[];
  variantsByProduct: Record<string, Variant[]>;
  onOpen: (slug: string) => void;
  onLoginRequired: () => void;
  loading: boolean;
};

export default function ProductGrid({
  products,
  variantsByProduct,
  onOpen,
  onLoginRequired,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-base font-medium text-slate-900">No products found</p>
        <p className="mt-1 text-sm text-slate-500">Try a different search or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          variants={variantsByProduct[p.id] || []}
          onOpen={onOpen}
          onLoginRequired={onLoginRequired}
        />
      ))}
    </div>
  );
}
