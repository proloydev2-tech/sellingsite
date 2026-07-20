import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Star, Plus, Minus, ShoppingCart, ShieldCheck, Clock, Heart, Check, Zap, ChevronRight,
} from 'lucide-react';
import type { Product, Variant } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { useCart } from '../lib/cart';
import { useFavorites } from '../lib/favorites';
import { useAuth } from '../lib/auth';
import Reviews from './Reviews';
import ProductCard from './ProductCard';

type Props = {
  slug: string;
  products: Product[];
  variantsByProduct: Record<string, Variant[]>;
  loading: boolean;
  onBack: () => void;
  onOpenProduct: (slug: string) => void;
  onAdded: () => void;
  onLoginRequired: () => void;
};

export default function ProductPage({
  slug,
  products,
  variantsByProduct,
  loading,
  onBack,
  onOpenProduct,
  onAdded,
  onLoginRequired,
}: Props) {
  const { add } = useCart();
  const { user } = useAuth();
  const { favoriteIds, toggle } = useFavorites();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);

  const product = useMemo(() => products.find((p) => p.slug === slug) || null, [products, slug]);
  const variants = product ? variantsByProduct[product.id] || [] : [];

  useEffect(() => {
    if (variants.length) setVariantId(variants[0].id);
    setQty(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, product?.id, variants.length]);

  const variant = variants.find((v) => v.id === variantId) || variants[0] || null;
  const isFav = product ? favoriteIds.has(product.id) : false;
  const hasDiscount = variant?.original_price && variant.original_price > variant.price;
  const discountPct = hasDiscount
    ? Math.round(((variant!.original_price! - variant!.price) / variant!.original_price!) * 100)
    : 0;
  const inStock = variants.length > 0 && variants.every((v) => (v.stock ?? 0) > 0);

  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category_id === product.category_id && p.id !== product.id)
      .slice(0, 4);
  }, [products, product]);

  const handleAdd = () => {
    if (!product || !variant) return;
    add({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.image_url,
      provider: product.provider,
      variantId: variant.id,
      variantLabel: variant.label,
      price: variant.price,
      quantity: qty,
    });
    onAdded();
  };

  const handleFav = () => {
    if (!product) return;
    if (!user) {
      onLoginRequired();
      return;
    }
    toggle(product.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-24 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-12 w-full animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-2xl font-bold text-slate-900">Product not found</p>
          <p className="mt-2 text-sm text-slate-500">This product may have been removed or the link is incorrect.</p>
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav className="flex items-center gap-1.5 py-3 text-xs text-slate-500">
            <button onClick={onBack} className="font-medium text-slate-600 hover:text-slate-900">
              Store
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="truncate text-slate-400">{product.provider || 'Products'}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="truncate font-medium text-slate-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="relative aspect-square">
              <img
                src={product.image_url || 'https://images.pexels.com/photos/2027065/pexels-photo-2027065.jpeg?auto=compress&cs=tinysrgb&w=900'}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
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
            </div>
          </div>

          <div className="flex flex-col">
            {product.provider && (
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
                {product.provider}
              </p>
            )}
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/60">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                {product.rating.toFixed(1)}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
                <Check className="h-3.5 w-3.5" />
                Instant delivery
              </span>
              <span className={`text-xs font-semibold ${inStock ? 'text-slate-500' : 'text-rose-500'}`}>
                {inStock ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {product.description || 'Digital product with instant delivery to your email after purchase.'}
            </p>

            {variants.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Choose option
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {variants.map((v) => {
                    const active = variantId === v.id;
                    const vDiscount = v.original_price && v.original_price > v.price;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVariantId(v.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/15'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-900">{v.label}</p>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <p className="text-sm font-bold text-slate-900">{formatPrice(v.price)}</p>
                          {vDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatPrice(v.original_price!)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-end justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                {variant && (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                      {formatPrice(variant.price * qty)}
                    </p>
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(variant.original_price! * qty)}
                      </span>
                    )}
                  </div>
                )}
                <p className="mt-0.5 text-xs text-slate-500">Total price · taxes included</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-base font-bold">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!variant}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to cart
              </button>
              <button
                onClick={handleFav}
                aria-label="Save to favorites"
                className="grid h-[52px] w-[52px] place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              >
                <Heart className={`h-5 w-5 transition ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <div className="flex flex-col items-start gap-1 rounded-xl bg-white p-3 ring-1 ring-slate-200/60">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Secure payment</span>
                <span className="text-slate-400">RupantorPay</span>
              </div>
              <div className="flex flex-col items-start gap-1 rounded-xl bg-white p-3 ring-1 ring-slate-200/60">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Instant delivery</span>
                <span className="text-slate-400">To your email</span>
              </div>
              <div className="flex flex-col items-start gap-1 rounded-xl bg-white p-3 ring-1 ring-slate-200/60">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Verified</span>
                <span className="text-slate-400">Authentic keys</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Customer reviews</h2>
          <Reviews productId={product.id} />
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">You may also like</h2>
                <p className="mt-0.5 text-sm text-slate-500">Related products from this category</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  variants={variantsByProduct[p.id] || []}
                  onOpen={onOpenProduct}
                  onLoginRequired={onLoginRequired}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
