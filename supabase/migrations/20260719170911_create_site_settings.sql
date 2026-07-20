/*
# Create site settings + content tables for admin-editable storefront

## Purpose
Move storefront content (site name, tagline, hero, footer, testimonials, FAQ,
features, contact info, currency) out of hardcoded component source and into
the database so the admin panel can edit it without redeploying.

Deployment-only secrets (Google OAuth client ID/secret, RupantorPay API key,
Supabase URL/keys) stay in Supabase project secrets / .env — they are NOT
stored here and are NOT editable from the admin panel.

## 1. New Tables

### `site_settings`
Single-row table (enforced by `is_singleton` check) holding global settings.
Columns:
- `id` (int, primary key, always 1)
- `site_name` (text, default 'VoltStore') — brand name shown in header/footer
- `tagline` (text, default 'Digital Goods') — small text under logo
- `hero_title` (text) — main hero headline
- `hero_subtitle` (text) — hero paragraph
- `hero_badge` (text) — small badge above hero title
- `hero_cta_label` (text) — primary button label
- `footer_tagline` (text) — short line under brand in footer
- `footer_copyright` (text) — copyright line
- `currency` (text, default 'BDT') — ISO currency code for prices
- `contact_email` (text) — support email
- `contact_whatsapp` (text) — WhatsApp number
- `social_twitter` (text, nullable)
- `social_instagram` (text, nullable)
- `social_github` (text, nullable)
- `updated_at` (timestamptz)

### `site_content`
Repeated content rows keyed by `section` + `sort_order`.
Columns:
- `id` (uuid, primary key)
- `section` (text) — one of 'feature', 'step', 'testimonial', 'faq', 'footer_link'
- `sort_order` (int, default 0)
- `title` (text)
- `body` (text, nullable) — description / answer / role
- `meta` (jsonb, nullable) — extra fields (rating, icon, link, column name)
- `created_at` (timestamptz)

## 2. Security (RLS)

Both tables:
- SELECT: public (anon + authenticated) — storefront must read these
- INSERT/UPDATE/DELETE: admin only. Admin identity is verified by matching
  the `admin_users` table via `username`. The frontend stores the signed-in
  admin username in localStorage; the service role is not used from the
  browser, so we gate writes by checking the admin_users table exists with
  that username. Since the anon client cannot impersonate an admin row
  without knowing admin credentials, this keeps writes admin-gated.

Because RLS cannot read localStorage, we use a simpler rule: writes are
restricted to `authenticated` role AND the user's email matches an
`admin_users.username` OR `admin_users.email`. For this app, admin login
uses the `admin_users` table (username + password) and is NOT a Supabase
auth session — so the anon client cannot satisfy `authenticated`. To keep
the admin panel functional while not exposing writes to the public anon
key, we instead gate writes by requiring the request to come through the
service role (which bypasses RLS) via an edge function. The admin panel
will call a thin edge function `admin-content` (service role) to mutate
these tables. SELECT remains public for the anon storefront.

## 3. Important Notes
1. The admin panel mutates content via the `admin-content` edge function
   using the service role key (kept server-side only).
2. The storefront reads `site_settings` and `site_content` directly with
   the anon key — no edge function needed for reads.
3. Singleton enforcement on `site_settings` via CHECK constraint.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'VoltStore',
  tagline text NOT NULL DEFAULT 'Digital Goods',
  hero_title text NOT NULL DEFAULT 'Digital products, delivered instantly',
  hero_subtitle text NOT NULL DEFAULT 'Game top-ups, streaming subscriptions, software licenses, and gift cards — all at the best prices, delivered to your inbox in seconds.',
  hero_badge text NOT NULL DEFAULT 'Instant digital delivery',
  hero_cta_label text NOT NULL DEFAULT 'Shop now',
  footer_tagline text NOT NULL DEFAULT 'Digital products delivered instantly, at the best prices.',
  footer_copyright text NOT NULL DEFAULT 'All rights reserved.',
  currency text NOT NULL DEFAULT 'BDT',
  contact_email text NOT NULL DEFAULT 'support@voltstore.shop',
  contact_whatsapp text NOT NULL DEFAULT '',
  social_twitter text,
  social_instagram text,
  social_github text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Writes gated via edge function (service role bypasses RLS)
DROP POLICY IF EXISTS "no_public_write_site_settings" ON site_settings;
-- No INSERT/UPDATE/DELETE policies => only service role can write

CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  body text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_content" ON site_content;
CREATE POLICY "public_read_site_content" ON site_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS site_content_section_sort_idx
  ON site_content (section, sort_order);

-- Seed the singleton settings row
INSERT INTO site_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- Seed default content so the storefront is populated out of the box
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'feature', 0, 'Instant delivery', 'Receive your digital products within seconds of payment.', '{"icon":"Zap"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='feature');
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'feature', 1, 'Secure payments', 'Encrypted checkout with multiple payment options.', '{"icon":"ShieldCheck"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='feature' AND sort_order=1);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'feature', 2, '24/7 availability', 'Our automated system never sleeps.', '{"icon":"Clock"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='feature' AND sort_order=2);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'feature', 3, 'Friendly support', 'Real humans ready to help via WhatsApp and email.', '{"icon":"Headphones"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='feature' AND sort_order=3);

INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'step', 0, 'Choose your product', 'Browse our catalog and pick the digital product you need.', '{"n":"01"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='step');
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'step', 1, 'Checkout securely', 'Pay with bKash, Nagad, Rocket, or card via RupantorPay.', '{"n":"02"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='step' AND sort_order=1);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'step', 2, 'Get instant delivery', 'Your product is delivered to your email immediately.', '{"n":"03"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='step' AND sort_order=2);

INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'testimonial', 0, 'Aisha K.', 'Got my Netflix subscription in under a minute. Best price I found anywhere!', '{"role":"Verified buyer","rating":5}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='testimonial');
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'testimonial', 1, 'Marco D.', 'Mobile Legends diamonds arrived instantly. Will buy again.', '{"role":"Verified buyer","rating":5}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='testimonial' AND sort_order=1);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'testimonial', 2, 'Sara P.', 'Customer support helped me pick the right Steam card. Super friendly.', '{"role":"Verified buyer","rating":5}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='testimonial' AND sort_order=2);

INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'faq', 0, 'How fast is delivery?', 'Most products are delivered within 60 seconds of payment confirmation. Some require manual verification and may take up to 10 minutes.', NULL
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='faq');
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'faq', 1, 'What payment methods do you accept?', 'We accept bKash, Nagad, Rocket, and major cards via RupantorPay.', NULL
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='faq' AND sort_order=1);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'faq', 2, 'Can I get a refund?', 'If a product fails to deliver and we cannot resolve the issue within 24 hours, we issue a full refund.', NULL
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='faq' AND sort_order=2);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'faq', 3, 'Is my payment secure?', 'All payments are processed over encrypted connections via RupantorPay. We never store your card details.', NULL
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='faq' AND sort_order=3);

INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 0, 'Shop', 'Game top-ups', '{"column":"Shop"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=0);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 1, 'Shop', 'Streaming', '{"column":"Shop"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=1);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 2, 'Shop', 'Software', '{"column":"Shop"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=2);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 3, 'Shop', 'Gift cards', '{"column":"Shop"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=3);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 4, 'Support', 'Help center', '{"column":"Support"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=4);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 5, 'Support', 'Track order', '{"column":"Support"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=5);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 6, 'Support', 'Refunds', '{"column":"Support"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=6);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 7, 'Support', 'Contact', '{"column":"Support"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=7);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 8, 'Company', 'About', '{"column":"Company"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=8);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 9, 'Company', 'Careers', '{"column":"Company"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=9);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 10, 'Company', 'Privacy', '{"column":"Company"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=10);
INSERT INTO site_content (section, sort_order, title, body, meta)
SELECT 'footer_link', 11, 'Company', 'Terms', '{"column":"Company"}'
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section='footer_link' AND sort_order=11);
