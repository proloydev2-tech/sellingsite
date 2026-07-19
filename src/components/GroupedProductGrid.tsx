import { useMemo, useState } from 'react';
import { SlidersHorizontal, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { Category, Product, Variant } from '../lib/supabase';
import ProductCard from './ProductCard';

type Props = {
  products: Product[];
  categories: Category[];
  variantsByProduct: Record<string, Variant[]>;
  onOpen: (slug: string) => void;
  onLoginRequired: () => void;
  onJumpCategory: (slug: string) => void;
  loading: boolean;
};

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rating';

function sortList(list: Product[], variantsByProduct: Record<string, Variant[]>, sort: Sort): Product[] {
  const priceOf = (p: Product) => {
    const vs = variantsByProduct[p.id] || [];
    if (!vs.length) return Infinity;
    return Math.min(...vs.map((v) => v.price));
  };
  const out = [...list];
  switch (sort) {
    case 'price-asc':
      return out.sort((a, b) => priceOf(a) - priceOf(b));
    case 'price-desc':
      return out.sort((a, b) => priceOf(b) - priceOf(a));
    case 'rating':
      return out.sort((a, b) => b.rating - a.rating);
    default:
      return out.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order,
      );
  }
}

export default function GroupedProductGrid({
  products,
  categories,
  variantsByProduct,
  onOpen,
  onLoginRequired,
  onJumpCategory,
  loading,
}: Props) {
  const [sort, setSort] = useState<Sort>('featured');

  const groups = useMemo(() => {
    return categories
      .map((cat) => {
        const items = sortList(
          products.filter((p) => p.category_id === cat.id),
          variantsByProduct,
          sort,
        );
        return { category: cat, items };
      })
      .filter((g) => g.items.length > 0);
  }, [products, categories, variantsByProduct, sort]);

  const totalCount = products.length;

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
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-base font-medium text-slate-900">No products found</p>
        <p className="mt-1 text-sm text-slate-500">Try a different search or category.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-[57px] z-20 -mx-4 mb-2 flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:px-4">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{totalCount}</span> products · {groups.length} categories
        </p>
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

      <div className="space-y-10">
        {groups.map(({ category, items }) => {
          const Icon = (Icons as any)[category.icon] as Icons.LucideIcon | undefined;
          return (
            <section key={category.id} id={`cat-${category.slug}`} className="scroll-mt-32">
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20">
                    {Icon ? <Icon className="h-5 w-5" strokeWidth={2.2} /> : null}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                      {category.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {items.length} product{items.length !== 1 ? 's' : ''}
                      {category.description ? ` · ${category.description}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onJumpCategory(category.slug)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    variants={variantsByProduct[p.id] || []}
                    onOpen={onOpen}
                    onLoginRequired={onLoginRequired}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
