/*
# Allow anon CRUD on catalog tables (demo admin)

1. Security changes
- This is a demo store with no sign-in. The admin panel is reachable at #/admin and writes
  directly to the catalog tables via the anon key. For demo purposes we open INSERT/UPDATE/DELETE
  on categories, products, and product_variants to anon, authenticated.
- Orders remain read-only from anon (already had SELECT + INSERT for checkout).
- Added UPDATE/DELETE on orders so the admin can mark or cancel orders.

2. Notes
- In production you would scope these policies to an authenticated admin role. For this demo
  we keep the catalog open so the admin panel works without auth.
- Idempotent: policies are dropped before recreate.
*/

-- categories: full CRUD for anon (demo admin)
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- products: full CRUD for anon (demo admin)
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- product_variants: full CRUD for anon (demo admin)
DROP POLICY IF EXISTS "anon_insert_variants" ON product_variants;
CREATE POLICY "anon_insert_variants" ON product_variants FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_variants" ON product_variants;
CREATE POLICY "anon_update_variants" ON product_variants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_variants" ON product_variants;
CREATE POLICY "anon_delete_variants" ON product_variants FOR DELETE
  TO anon, authenticated USING (true);

-- orders: allow update + delete for admin
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- order_items: allow update + delete
DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE
  TO anon, authenticated USING (true);
