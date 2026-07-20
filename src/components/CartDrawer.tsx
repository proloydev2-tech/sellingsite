import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/format';

type Props = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

export default function CartDrawer({ open, onClose, onCheckout }: Props) {
  const { items, remove, setQty, total, count } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ShoppingBag className="h-5 w-5" />
            Your cart ({count})
          </h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-3 font-medium text-slate-900">Your cart is empty</p>
                <p className="mt-1 text-sm text-slate-500">Add some products to get started.</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={i.variantId}
                  className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img
                      src={i.imageUrl || 'https://images.pexels.com/photos/2027065/pexels-photo-2027065.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={i.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-semibold text-slate-900">{i.productName}</p>
                    <p className="text-xs text-slate-500">{i.variantLabel}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQty(i.variantId, i.quantity - 1)}
                          className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                        <button
                          onClick={() => setQty(i.variantId, i.quantity + 1)}
                          className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {formatPrice(i.price * i.quantity)}
                        </span>
                        <button
                          onClick={() => remove(i.variantId)}
                          className="text-slate-400 transition hover:text-rose-500"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Subtotal</span>
              <span className="text-lg font-bold text-slate-900">{formatPrice(total)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95"
            >
              Checkout
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
