import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { verifyPayment } from '../lib/payment';
import { supabase } from '../lib/supabase';

type Props = {
  onDismiss: () => void;
};

type State = { kind: 'verifying' } | { kind: 'success'; order: string } | { kind: 'failed'; message: string };

export default function PaymentReturn({ onDismiss }: Props) {
  const [state, setState] = useState<State>({ kind: 'verifying' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const transactionId = params.get('transactionId') || params.get('tx') || params.get('transaction_id');
    const order = params.get('order') || '';

    const finalize = async () => {
      if (!transactionId) {
        setState({ kind: 'failed', message: 'No transaction reference found in the return URL.' });
        return;
      }
      const result = await verifyPayment(transactionId);
      if (result.ok && result.status === 'COMPLETED') {
        if (order) {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              transaction_id: result.transaction_id || transactionId,
              currency: result.currency || 'BDT',
              payment_method: result.payment_method || 'rupantorpay',
            })
            .eq('order_number', order);
        }
        setState({ kind: 'success', order });
      } else {
        if (order) {
          await supabase.from('orders').update({ status: 'failed', transaction_id: transactionId }).eq('order_number', order);
        }
        setState({ kind: 'failed', message: result.message || result.status || 'Payment was not completed.' });
      }
    };

    if (status === 'cancel' || params.get('payment') === 'cancel') {
      if (order) supabase.from('orders').update({ status: 'cancelled' }).eq('order_number', order);
      setState({ kind: 'failed', message: 'Payment was cancelled.' });
      return;
    }
    finalize();
  }, []);

  const cleanUrl = () => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    window.history.replaceState({}, document.title, url.toString());
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {state.kind === 'verifying' ? (
          <div className="py-6 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-500" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">Verifying payment</h2>
            <p className="mt-1 text-sm text-slate-500">Please wait while we confirm your transaction with the payment gateway.</p>
          </div>
        ) : state.kind === 'success' ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Payment successful!</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your order <span className="font-mono font-semibold text-slate-900">{state.order || '—'}</span> is confirmed.
              We've emailed your digital products.
            </p>
            <button
              onClick={cleanUrl}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-400"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="py-6 text-center">
            <XCircle className="mx-auto h-14 w-14 text-red-500" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Payment not completed</h2>
            <p className="mt-1 text-sm text-slate-500">{state.message}</p>
            <button
              onClick={cleanUrl}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to store
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
