import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { Product, Variant } from '../lib/supabase';
import ProductCard from './ProductCard';

type Props = {
  products: Product[];
  variantsByProduct: Record<string, Variant[]>;
  onOpen: (slug: string) => void;
  onLoginRequired: () => void;
  loading: boolean;
  title?: string;
};

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export default function ProductGrid({
  products,
  variantsByProduct,
  onOpen,
  onLoginRequired,
  loading,
  title = 'All products',
}: Props) {
  const [sort, setSort] = useState<Sort>('featured');

  const sorted = useMemo(() => {
    const priceOf = (p: Product) => {
      const vs = variantsByProduct[p.id] || [];
      if (!vs.length) return Infinity;
      return Math.min(...vs.map((v) => v.price));
    };
    const list = [...products];
    switch (sort) {
      case 'price-asc':
        return list.sort((a, b) => priceOf(a) - priceOf(b));
      case 'price-desc':
        return list.sort((a, b) => priceOf(b) - priceOf(a));
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating);
      default:
        return list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
  }, [products, variantsByProduct, sort]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="aspect-[4/3] animate-pulse bg-slate-100" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 flex justify-between">
                <div className="h-6 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-8 w-14 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
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
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{products.length}</span> product{products.length !== 1 ? 's' : ''} · instant delivery
          </p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden text-slate-400 sm:inline">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="cursor-pointer bg-transparent text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="featured">Featured first</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {sorted.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            variants={variantsByProduct[p.id] || []}
            onOpen={onOpen}
            onLoginRequired={onLoginRequired}
          />
        ))}
      </div>
    </div>
  );
}
