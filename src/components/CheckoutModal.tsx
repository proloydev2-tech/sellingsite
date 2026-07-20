import { useState } from 'react';
import { X, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { formatPrice, orderNumber } from '../lib/format';
import { supabase } from '../lib/supabase';
import { createPayment } from '../lib/payment';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
};

export default function CheckoutModal({ open, onClose, onSuccess }: Props) {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: (user?.user_metadata?.full_name as string) || '',
    email: user?.email || '',
    whatsapp: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const num = orderNumber();
      const { data, error: insertError } = await supabase
        .from('orders')
        .insert({
          order_number: num,
          customer_name: form.name,
          customer_email: form.email,
          customer_whatsapp: form.whatsapp.trim() || null,
          total,
          status: 'pending',
          payment_method: 'rupantorpay',
          payment_provider: 'rupantorpay',
          user_id: user?.id || null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      const orderId = (data as any).id as string;

      const orderItems = items.map((i) => ({
        order_id: orderId,
        product_id: i.productId,
        variant_id: i.variantId,
        product_name: i.productName,
        variant_label: i.variantLabel,
        price: i.price,
        quantity: i.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);

      // Send order placed email to customer (best-effort, don't block checkout)
      supabase.functions.invoke('order-email', { body: { order_id: orderId } }).catch(() => {});

      // Send Telegram notification to admin chat (best-effort)
      supabase.functions.invoke('telegram-notify', { body: { order_id: orderId } }).catch(() => {});

      const origin = window.location.origin;
      const result = await createPayment({
        fullname: form.name,
        email: form.email,
        amount: total,
        order_id: num,
        success_url: `${origin}/?payment=success&order=${num}`,
        cancel_url: `${origin}/?payment=cancel&order=${num}`,
      });

      if (!result.ok || !result.payment_url) {
        throw new Error(result.message || 'Failed to start payment');
      }

      clear();
      window.location.href = result.payment_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Order confirmed!</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your order number is <span className="font-mono font-semibold text-slate-900">{done}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              We've emailed your digital products to {form.email}.
            </p>
            <button
              onClick={() => {
                setDone(null);
                onClose();
              }}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-900">Checkout</h2>
            <p className="mt-1 text-sm text-slate-500">Complete your purchase — instant delivery after payment.</p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <Field label="Full name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="John Doe"
                />
              </Field>
              <Field label="Email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="WhatsApp (optional)">
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="+880 1XXX XXXXXX"
                />
              </Field>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-slate-600">
                  <span>Processing fee</span>
                  <span>$0.00</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Redirecting to payment...' : `Pay ${formatPrice(total)}`}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure payment via RupantorPay — bKash, Nagad, Rocket, cards & more.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
