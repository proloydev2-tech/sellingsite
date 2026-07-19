import { supabase } from './supabase';

const PROJECT_REF = '0ec90b57d6e95fcbda19832f';
const FUNCTIONS_BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;

async function invoke(slug: string, body: unknown) {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const res = await fetch(`${FUNCTIONS_BASE}/${slug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ status: false, message: 'Invalid response from server' }));
  return { ok: res.ok, data };
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
