import { Star, Plus, Heart, Eye, Zap, Check } from 'lucide-react';
import type { Product, Variant } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { useCart } from '../lib/cart';
import { useFavorites } from '../lib/favorites';
import { useAuth } from '../lib/auth';

type Props = {
  product: Product;
  variants: Variant[];
  onOpen: (slug: string) => void;
  onLoginRequired: () => void;
};

export default function ProductCard({ product, variants, onOpen, onLoginRequired }: Props) {
  const { add } = useCart();
  const { user } = useAuth();
  const { favoriteIds, toggle } = useFavorites();
  const isFav = favoriteIds.has(product.id);
  const cheapest = variants.length
    ? variants.reduce((m, v) => (v.price < m.price ? v : m), variants[0])
    : null;
  const hasDiscount = cheapest?.original_price && cheapest.original_price > cheapest.price;
  const discountPct = hasDiscount
    ? Math.round(((cheapest!.original_price! - cheapest!.price) / cheapest!.original_price!) * 100)
    : 0;
  const inStock = variants.length > 0 && variants.every((v) => (v.stock ?? 0) > 0);

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onLoginRequired();
      return;
    }
    toggle(product.id);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cheapest) return;
    add({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.image_url,
      provider: product.provider,
      variantId: cheapest.id,
      variantLabel: cheapest.label,
      price: cheapest.price,
      quantity: 1,
    });
  };

  return (
    <div
      onClick={() => onOpen(product.slug)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/60"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.image_url || 'https://images.pexels.com/photos/2027065/pexels-photo-2027065.jpeg?auto=compress&cs=tinysrgb&w=600'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-col gap-1.5">
            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/30">
                <Zap className="h-2.5 w-2.5" />
                Featured
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-rose-500/30">
                -{discountPct}%
              </span>
            )}
          </div>
          <button
            onClick={handleFav}
            aria-label="Toggle favorite"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:scale-110 hover:bg-white hover:text-rose-500"
          >
            <Heart className={`h-4 w-4 transition ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-3 pt-8 transition duration-300 group-hover:translate-y-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
            <Eye className="h-3.5 w-3.5" />
            Quick view
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {product.provider && (
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                {product.provider}
              </p>
            )}
            <h3 className="truncate text-sm font-semibold leading-tight text-slate-900">{product.name}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/60">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            {product.rating.toFixed(1)}
          </div>
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {product.description || 'Digital product, instant delivery.'}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            <Check className="h-2.5 w-2.5" />
            Instant
          </span>
          {inStock ? (
            <span className="text-[10px] font-medium text-slate-400">In stock</span>
          ) : (
            <span className="text-[10px] font-medium text-rose-500">Out of stock</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            {cheapest && (
              <>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">From</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-lg font-extrabold tracking-tight text-slate-900">{formatPrice(cheapest.price)}</p>
                  {hasDiscount && (
                    <span className="text-xs font-normal text-slate-400 line-through">
                      {formatPrice(cheapest.original_price!)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          {cheapest && (
            <button
              onClick={handleAdd}
              aria-label="Add to cart"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 hover:shadow-emerald-500/30 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
