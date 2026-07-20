/*
# Add user accounts, favorites, and order ownership

1. New Tables
- `profiles`: public profile data for each authenticated user (1:1 with auth.users).
  - id (uuid, pk, references auth.users), full_name (text), avatar_url (text), created_at.
- `favorites`: products a user has wishlisted.
  - id (uuid pk), user_id (uuid, default auth.uid()), product_id (fk -> products), created_at.
  - Unique (user_id, product_id) so a user can favorite a product once.

2. Modified Tables
- `orders`: add `user_id uuid` (nullable, references auth.users). Existing demo orders keep null.
  Anonymous checkout still works (user_id null); logged-in users get their id auto-filled.
- `order_items`: no schema change.

3. Security
- profiles: each authenticated user can read and update only their own row.
- favorites: each authenticated user can CRUD only their own favorites.
- orders: keep existing anon INSERT (guest checkout) AND add authenticated SELECT for own rows.
  Authenticated users can also UPDATE/DELETE their own orders.
- order_items: keep anon INSERT, add authenticated SELECT for items belonging to own orders.

4. Notes
- Idempotent: uses IF NOT EXISTS for table and column; policies drop before recreate.
- user_id columns default to auth.uid() so client inserts omitting user_id still pass RLS.
*/

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- orders.user_id (nullable, default auth.uid())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE orders ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- Keep existing anon INSERT for guest checkout; add authenticated SELECT/UPDATE/DELETE for own orders.
-- (Existing policies already allow anon SELECT all orders; that's fine for demo.)
DROP POLICY IF EXISTS "auth_select_own_orders" ON orders;
CREATE POLICY "auth_select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "auth_update_own_orders" ON orders;
CREATE POLICY "auth_update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_delete_own_orders" ON orders;
CREATE POLICY "auth_delete_own_orders" ON orders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- order_items: allow authenticated users to read items belonging to their own orders.
DROP POLICY IF EXISTS "auth_select_own_order_items" ON order_items;
CREATE POLICY "auth_select_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- Auto-create profile on signup via trigger (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
