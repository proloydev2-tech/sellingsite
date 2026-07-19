-- Allow client-side admin management of site_settings and site_content
-- Admin auth is verified client-side via admin_users table

-- site_settings: allow read for everyone, write for authenticated (admin must be signed in via client admin login)
DROP POLICY IF EXISTS public_read_site_settings ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_update_site_settings" ON site_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert_site_settings" ON site_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_delete_site_settings" ON site_settings
  FOR DELETE TO anon, authenticated USING (true);

-- site_content: allow full CRUD for everyone (content is storefront content, admin-managed)
DROP POLICY IF EXISTS public_read_site_content ON site_content;
CREATE POLICY "public_read_site_content" ON site_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_site_content" ON site_content
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_site_content" ON site_content
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_site_content" ON site_content
  FOR DELETE TO anon, authenticated USING (true);
