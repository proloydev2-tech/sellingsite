/*
# Digital Store Schema (single-tenant demo, no auth)

1. New Tables
- `categories`: top-level grouping (e.g. Game Topup, Streaming, Software).
  - id (uuid pk), name (text), slug (text unique), icon (text), description (text), sort_order (int), created_at.
- `products`: digital products/subscriptions belonging to a category.
  - id (uuid pk), category_id (fk -> categories), name (text), slug (text unique),
    description (text), image_url (text), provider (text, e.g. Netflix, Steam),
    rating (numeric 0-5), featured (bool), sort_order (int), created_at.
- `product_variants`: purchasable SKUs per product (e.g. 1 month, 3 months, 100 diamonds).
  - id (uuid pk), product_id (fk -> products), label (text), price (numeric),
    original_price (numeric nullable), sku (text), stock (int), sort_order (int), created_at.
- `orders`: customer purchase records.
  - id (uuid pk), order_number (text unique), customer_name (text), customer_email (text),
    customer_whatsapp (text), total (numeric), status (text default 'pending'),
    payment_method (text), created_at.
- `order_items`: line items per order.
  - id (uuid pk), order_id (fk -> orders), product_id (fk -> products), variant_id (fk -> product_variants),
    product_name (text), variant_label (text), price (numeric), quantity (int).

2. Security
- This is a demo storefront with NO sign-in screen, so all policies use TO anon, authenticated
  and the data is intentionally public/shared (catalog + orders are demo data).
- Orders are writable by anon so a guest checkout can create and read its own order by id.

3. Notes
- Idempotent: uses IF NOT EXISTS for tables; policies are dropped before recreate.
- All prices stored as numeric(12,2) in USD.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'ShoppingBag',
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  provider text,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label text NOT NULL,
  price numeric(12,2) NOT NULL,
  original_price numeric(12,2),
  sku text,
  stock int NOT NULL DEFAULT 99,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_whatsapp text,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'qris',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_label text NOT NULL,
  price numeric(12,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories: public read, no writes from client (managed via seed/migration)
DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Products: public read
DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Variants: public read
DROP POLICY IF EXISTS "anon_read_variants" ON product_variants;
CREATE POLICY "anon_read_variants" ON product_variants FOR SELECT
  TO anon, authenticated USING (true);

-- Orders: anyone can create and read (demo). In a real app you'd scope by user_id or a token.
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

-- Order items: insert + select
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
