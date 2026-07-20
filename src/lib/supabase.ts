import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qtekdrdtqizpnseiahvs.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZWtkcmR0cWl6cG5zZWlhaHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTgzNjUsImV4cCI6MjEwMDAzNDM2NX0.0keRaEYV0lF_oresUYkxOdLbSZI760QeLqf4fnno1ZQ';

export const supabaseConfigured = true;

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  provider: string | null;
  rating: number;
  featured: boolean;
  sort_order: number;
};

export type Variant = {
  id: string;
  product_id: string;
  label: string;
  price: number;
  original_price: number | null;
  sku: string | null;
  stock: number;
  sort_order: number;
};

export type CartItem = {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  provider: string | null;
  variantId: string;
  variantLabel: string;
  price: number;
  quantity: number;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string | null;
  total: number;
  status: string;
  payment_method: string;
  user_id: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string;
  price: number;
  quantity: number;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
};
