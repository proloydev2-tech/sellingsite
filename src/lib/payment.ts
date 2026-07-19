import { supabase } from './supabase';

async function invoke(slug: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(slug, { body });
  if (error) return { ok: false, data: { status: false, message: error.message || 'Network error' } };
  return { ok: !data?.error, data };
}

export type CheckoutResult = {
  ok: boolean;
  payment_url?: string;
  message?: string;
};

export async function createPayment(args: {
  fullname: string;
  email: string;
  amount: number;
  order_id: string;
  success_url?: string;
  cancel_url?: string;
}): Promise<CheckoutResult> {
  const { ok, data } = await invoke('rupantorpay-checkout', args);
  if (ok && data?.status === true && data?.payment_url) {
    return { ok: true, payment_url: data.payment_url as string };
  }
  return { ok: false, message: data?.message || 'Failed to create payment session' };
}

export type VerifyResult = {
  ok: boolean;
  status?: string;
  amount?: string;
  transaction_id?: string;
  trx_id?: string;
  payment_method?: string;
  currency?: string;
  message?: string;
};

export async function verifyPayment(transaction_id: string): Promise<VerifyResult> {
  const { ok, data } = await invoke('rupantorpay-verify', { transaction_id });
  if (ok && data?.status === 'COMPLETED') {
    return {
      ok: true,
      status: data.status,
      amount: data.amount,
      transaction_id: data.transaction_id,
      trx_id: data.trx_id,
      payment_method: data.payment_method,
      currency: data.currency,
    };
  }
  return {
    ok: false,
    status: data?.status,
    message: data?.message || (data?.status ? `Payment ${data.status}` : 'Verification failed'),
  };
}

export { supabase };
