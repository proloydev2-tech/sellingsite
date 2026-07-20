/*
# Create store schema (catalog + orders)

1. New Tables
- categories, products, product_variants, orders, order_items
2. Security
- RLS on every table. Catalog public read + open write (demo admin).
- Orders: anon can insert (guest checkout) and read all (demo).
3. Seed data
- 5 categories, 6 products, 10 variants.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'Package',
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  provider text,
  rating numeric NOT NULL DEFAULT 4.5,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  sku text,
  stock int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_whatsapp text,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid',
  payment_method text NOT NULL DEFAULT 'card',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid,
  variant_id uuid,
  product_name text NOT NULL,
  variant_label text,
  price numeric NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_categories" ON categories;
CREATE POLICY "anon_write_categories" ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_products" ON products;
CREATE POLICY "anon_write_products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_variants" ON product_variants;
CREATE POLICY "anon_read_variants" ON product_variants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_write_variants" ON product_variants;
CREATE POLICY "anon_write_variants" ON product_variants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);

INSERT INTO categories (name, slug, icon, description, sort_order) VALUES
  ('Game Top-ups', 'game-topups', 'Gamepad2', 'Mobile game currency and diamonds', 1),
  ('Streaming', 'streaming', 'Tv', 'Netflix, Spotify, Disney+ and more', 2),
  ('Software', 'software', 'Code', 'Software licenses and product keys', 3),
  ('Gift Cards', 'gift-cards', 'Gift', 'Amazon, Google Play, iTunes', 4),
  ('Phone Credit', 'phone-credit', 'Smartphone', 'Prepaid mobile recharge', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, image_url, provider, rating, featured, sort_order)
SELECT c.id, 'Mobile Legends Diamonds', 'mobile-legends-diamonds', 'Top up Mobile Legends: Bang Bang diamonds instantly. Region: Global.', 'https://images.pexels.com/photos/2027065/pexels-photo-2027065.jpeg?auto=compress&cs=tinysrgb&w=600', 'Moonton', 4.8, true, 1
FROM categories c WHERE c.slug = 'game-topups'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, image_url, provider, rating, featured, sort_order)
SELECT c.id, 'Netflix Premium 4K', 'netflix-premium-4k', 'Netflix Premium 4K Ultra HD monthly subscription. Shared account option.', 'https://images.pexels.com/photos/2789349/pexels-photo-2789349.jpeg?auto=compress&cs=tinysrgb&w=600', 'Netflix', 4.7, true, 1
FROM categories c WHERE c.slug = 'streaming'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, image_url, provider, rating, featured, sort_order)
SELECT c.id, 'Spotify Premium 1 Month', 'spotify-premium-1-month', 'Spotify Premium individual plan — ad-free music for 30 days.', 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=600', 'Spotify', 4.6, false, 2
FROM categories c WHERE c.slug = 'streaming'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, image_url, provider, rating, featured, sort_order)
SELECT c.id, 'Steam Wallet $20', 'steam-wallet-20', 'Steam gift card code worth $20 USD. Redeem on any Steam account.', 'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=600', 'Valve', 4.9, true, 1
FROM categories c WHERE c.slug = 'gift-cards'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, image_url, provider, rating, featured, sort_order)
SELECT c.id, 'Google Play $10', 'google-play-10', 'Google Play gift card worth $10 USD for apps, games, and in-app purchases.', 'https://images.pexels.com/photos/2673505/pexels-photo-2673505.jpeg?auto=compress&cs=tinysrgb&w=600', 'Google', 4.5, false, 2
FROM categories c WHERE c.slug = 'gift-cards'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, image_url, provider, rating, featured, sort_order)
SELECT c.id, 'Microsoft Office 365', 'microsoft-office-365', 'Office 365 Personal 1-year subscription. Word, Excel, PowerPoint, 1TB OneDrive.', 'https://images.pexels.com/photos/5077047/pexels-photo-5077047.jpeg?auto=compress&cs=tinysrgb&w=600', 'Microsoft', 4.7, false, 1
FROM categories c WHERE c.slug = 'software'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '86 Diamonds', 0.99, 1.49, 999, 1 FROM products WHERE slug = 'mobile-legends-diamonds'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '257 Diamonds', 2.49, 3.49, 999, 2 FROM products WHERE slug = 'mobile-legends-diamonds'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '568 Diamonds', 4.99, 6.49, 999, 3 FROM products WHERE slug = 'mobile-legends-diamonds'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '1 Month', 11.99, 15.99, 999, 1 FROM products WHERE slug = 'netflix-premium-4k'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '3 Months', 32.99, 47.99, 999, 2 FROM products WHERE slug = 'netflix-premium-4k'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '1 Month', 9.99, 12.99, 999, 1 FROM products WHERE slug = 'spotify-premium-1-month'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '1 Year', 99.99, 119.99, 999, 2 FROM products WHERE slug = 'spotify-premium-1-month'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '$20 USD', 19.99, 24.99, 999, 1 FROM products WHERE slug = 'steam-wallet-20'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, '$10 USD', 9.99, 12.99, 999, 1 FROM products WHERE slug = 'google-play-10'
ON CONFLICT DO NOTHING;
INSERT INTO product_variants (product_id, label, price, original_price, stock, sort_order)
SELECT id, 'Personal 1Y', 49.99, 69.99, 999, 1 FROM products WHERE slug = 'microsoft-office-365'
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
