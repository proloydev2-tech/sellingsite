# VoltStore — Digital Products & Subscriptions Store

A modern, mobile-first storefront for selling digital products: game top-ups, streaming subscriptions, software licenses, gift cards, and phone credit. Built with React + Vite + Tailwind + Supabase.

## Features

- **Storefront** (light, professional theme)
  - Hero, category filter, search, responsive product grid
  - Product detail modal with variant picker and quantity
  - Cart drawer with persistent storage (localStorage)
  - Checkout flow that writes real orders to Supabase
  - Features, How-it-works, Testimonials, FAQ, CTA sections
- **Authentication**
  - Email & password sign up (name, email, phone, password)
  - Email & password sign in
  - Google sign-in via Supabase Auth (OAuth)
  - Session persistence across reloads
  - Protected account page
- **Reviews**
  - Customers can write reviews (1-5 stars + comment) on any product
  - Reviews shown on product detail page with average rating
  - "My reviews" tab in account page
  - Admin can approve/hide/delete reviews
- **Account page** (`#/account`)
  - Order history with line items
  - Saved favorites (wishlist)
  - My reviews
  - Profile details
- **Admin panel** (`#/admin`) — gated
  - Separate admin login (username: `praloy`, password: `praloy`)
  - No admin button in customer UI — access via `#/admin` URL only
  - Dashboard with revenue, orders, products, categories, reviews stats
  - Product CRUD with variant editor
  - Category CRUD with icon picker
  - Order management with status updates
  - Reviews moderation (approve / hide / delete)
  - Admin logout
- **Mobile-first design**
  - Bottom tab navigation on mobile
  - Touch-friendly cards and controls
  - Responsive across all viewport sizes

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Hosting**: Vercel (static SPA)

## Getting Started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build → dist/
npm run typecheck
```

## Environment Variables

Set these in `.env`:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Authentication

**Email & password** works out of the box (no setup required). Users sign up with name, email, phone, and password.

**Google sign-in** is optional. To enable it:
1. Go to **Supabase Dashboard → Authentication → Providers → Google**.
2. Toggle Enable.
3. Create a Google OAuth client in Google Cloud Console:
   - Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Copy the Google Client ID and Client Secret into the Supabase Google provider config.
5. After deploying, add your domain to Supabase's **Auth → Redirect URLs**:
   `https://<your-domain>/**`

**Admin login** is separate from customer auth. Default credentials:
- Username: `praloy`
- Password: `praloy`
- Access via `#/admin` URL only (no admin button in customer UI).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Vite. Defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

## Routes (hash-based)

- `#/` — Storefront
- `#/login` — Sign in / Sign up (email+password or Google)
- `#/account` — Account (orders, favorites, my reviews, profile)
- `#/admin` — Admin login → Admin dashboard (gated)

## Database

Schema (managed in Supabase):
- `categories`, `products`, `product_variants` — catalog
- `orders`, `order_items` — purchases
- `profiles` — user profile (1:1 with auth.users, auto-created on signup)
- `favorites` — wishlist (user_id + product_id, unique)
- `reviews` — product reviews (author, rating, comment, approved)
- `admin_users` — admin credentials (username, password)

RLS is enabled on every table. Catalog is readable by anon; orders/favorites/profiles/reviews are owner-scoped to authenticated users.

## License

Demo project — free to use and modify.
