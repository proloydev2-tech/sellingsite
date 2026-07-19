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
  - Google sign-in via Supabase Auth (OAuth)
  - Session persistence across reloads
  - Protected account page
- **Account page** (`#/account`)
  - Order history with line items
  - Saved favorites (wishlist)
  - Profile details
- **Admin panel** (`#/admin`)
  - Dashboard with revenue, orders, products, categories stats
  - Product CRUD with variant editor
  - Category CRUD with icon picker
  - Order management with status updates
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

## Enable Google Sign-In

1. Go to **Supabase Dashboard → Authentication → Providers → Google**.
2. Toggle Enable.
3. Create a Google OAuth client in Google Cloud Console:
   - Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Copy the Google Client ID and Client Secret into the Supabase Google provider config.
5. After deploying, add your domain to Supabase's **Auth → Redirect URLs**:
   `https://<your-domain>/**`

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
- `#/login` — Sign in with Google
- `#/account` — Account (orders, favorites, profile)
- `#/admin` — Admin dashboard

## Database

Schema (managed in Supabase):
- `categories`, `products`, `product_variants` — catalog
- `orders`, `order_items` — purchases
- `profiles` — user profile (1:1 with auth.users, auto-created on signup)
- `favorites` — wishlist (user_id + product_id, unique)

RLS is enabled on every table. Catalog is readable by anon; orders/favorites/profiles are owner-scoped to authenticated users.

## License

Demo project — free to use and modify.
