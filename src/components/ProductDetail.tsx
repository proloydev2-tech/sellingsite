import { useEffect, useState } from 'react';
import { X, Star, Plus, Minus, ShoppingCart, ShieldCheck, Clock, Heart } from 'lucide-react';
import type { Product, Variant } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { useCart } from '../lib/cart';
import { useFavorites } from '../lib/favorites';
import { useAuth } from '../lib/auth';

type Props = {
  product: Product | null;
  variants: Variant[];
  onClose: () => void;
  onAdded: () => void;
  onLoginRequired?: () => void;
};

export default function ProductDetail({ product, variants, onClose, onAdded, onLoginRequired }: Props) {
  const { add } = useCart();
  const { user } = useAuth();
  const { favoriteIds, toggle } = useFavorites();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (variants.length) setVariantId(variants[0].id);
    setQty(1);
  }, [product?.id, variants.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (product) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [product, onClose]);

  if (!product) return null;

  const variant = variants.find((v) => v.id === variantId) || variants[0] || null;
  const isFav = favoriteIds.has(product.id);
  const hasDiscount = variant?.original_price && variant.original_price > variant.price;

  const handleAdd = () => {
    if (!variant) return;
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
    onClose();
  };

  const handleFav = () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    toggle(product.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid max-h-[92vh] grid-cols-1 overflow-y-auto sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden bg-slate-100 sm:aspect-auto">
            <img
              src={product.image_url || 'https://images.pexels.com/photos/2027065/pexels-photo-2027065.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col p-5 sm:p-6">
            {product.provider && (
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                {product.provider}
              </p>
            )}
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{product.name}</h2>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {product.rating.toFixed(1)}
              </div>
              <span className="text-xs text-slate-500">Instant delivery</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {product.description || 'Digital product with instant delivery to your email after purchase.'}
            </p>

            {variants.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Choose option
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        variantId === v.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-xs">{v.label}</p>
                        <p className="text-xs font-bold">{formatPrice(v.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-end justify-between">
              <div>
                {variant && (
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{formatPrice(variant.price)}</p>
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(variant.original_price!)}
                      </span>
                    )}
                  </div>
                )}
                <p className="mt-0.5 text-xs text-slate-500">Total price</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={handleAdd}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to cart
              </button>
              <button
                onClick={handleFav}
                aria-label="Save to favorites"
                className="grid h-12 w-12 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              >
                <Heart className={`h-5 w-5 transition ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Secure payment
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Instant delivery
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
