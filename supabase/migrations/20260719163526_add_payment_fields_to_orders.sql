ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'rupantorpay';

-- Allow the anon/service role (edge functions) to update order status by transaction_id
-- Edge functions use the service role key, so they bypass RLS. No new policy needed.
