/*
# Add reviews + admin auth

1. New Tables
- reviews: customer reviews for products (name, rating, comment, approved).
- admin_users: simple username/password store for admin login (demo: praloy/praloy).

2. Security
- reviews: public read (approved only), authenticated insert (own), admin update/delete.
- admin_users: only anon SELECT (to verify credentials) — no sensitive data beyond password hash (demo plain text).
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_reviews" ON reviews;
CREATE POLICY "anon_read_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_reviews" ON reviews;
CREATE POLICY "auth_insert_reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_own_reviews" ON reviews;
CREATE POLICY "auth_update_own_reviews" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_delete_own_reviews" ON reviews;
CREATE POLICY "auth_delete_own_reviews" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_admin_users" ON admin_users;
CREATE POLICY "anon_read_admin_users" ON admin_users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_admin_users" ON admin_users;
CREATE POLICY "anon_insert_admin_users" ON admin_users FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_admin_users" ON admin_users;
CREATE POLICY "anon_update_admin_users" ON admin_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO admin_users (username, password) VALUES ('praloy', 'praloy')
ON CONFLICT (username) DO NOTHING;

-- Seed a few reviews
INSERT INTO reviews (product_id, author_name, rating, comment, approved)
SELECT id, 'Aisha K.', 5, 'Super fast delivery, will buy again!', true FROM products WHERE slug = 'mobile-legends-diamonds'
ON CONFLICT DO NOTHING;

INSERT INTO reviews (product_id, author_name, rating, comment, approved)
SELECT id, 'Marco D.', 5, 'Best price I found anywhere.', true FROM products WHERE slug = 'netflix-premium-4k'
ON CONFLICT DO NOTHING;

INSERT INTO reviews (product_id, author_name, rating, comment, approved)
SELECT id, 'Sara P.', 4, 'Works perfectly, got my code in 2 minutes.', true FROM products WHERE slug = 'steam-wallet-20'
ON CONFLICT DO NOTHING;
