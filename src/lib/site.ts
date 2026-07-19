import { supabase } from './supabase';

export type SiteSettings = {
  id: number;
  site_name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_badge: string;
  hero_cta_label: string;
  footer_tagline: string;
  footer_copyright: string;
  currency: string;
  contact_email: string;
  contact_whatsapp: string;
  social_twitter: string | null;
  social_instagram: string | null;
  social_github: string | null;
  updated_at: string;
};

export type SiteContent = {
  id: string;
  section: string;
  sort_order: number;
  title: string;
  body: string | null;
  meta: Record<string, any> | null;
  created_at: string;
};

export const defaultSettings: SiteSettings = {
  id: 1,
  site_name: 'VoltStore',
  tagline: 'Digital Goods',
  hero_title: 'Digital products, delivered instantly',
  hero_subtitle:
    'Game top-ups, streaming subscriptions, software licenses, and gift cards — all at the best prices, delivered to your inbox in seconds.',
  hero_badge: 'Instant digital delivery',
  hero_cta_label: 'Shop now',
  footer_tagline: 'Digital products delivered instantly, at the best prices.',
  footer_copyright: 'All rights reserved.',
  currency: 'BDT',
  contact_email: 'support@voltstore.shop',
  contact_whatsapp: '',
  social_twitter: null,
  social_instagram: null,
  social_github: null,
  updated_at: '',
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data) return defaultSettings;
  return data as SiteSettings;
}

export async function fetchSiteContent(): Promise<SiteContent[]> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('section')
    .order('sort_order');
  if (error || !data) return [];
  return data as SiteContent[];
}

const ADMIN_KEY = 'voltstore_admin_user';
const ADMIN_PASS_KEY = 'voltstore_admin_pass';

export function getAdminCreds(): { username: string; password: string } | null {
  try {
    const username = localStorage.getItem(ADMIN_KEY);
    const password = localStorage.getItem(ADMIN_PASS_KEY);
    if (username && password) return { username, password };
  } catch {
    // ignore
  }
  return null;
}

export function setAdminCreds(username: string, password: string) {
  try {
    localStorage.setItem(ADMIN_KEY, username);
    localStorage.setItem(ADMIN_PASS_KEY, password);
  } catch {
    // ignore
  }
}

export function clearAdminCreds() {
  try {
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(ADMIN_PASS_KEY);
  } catch {
    // ignore
  }
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`;
const FN_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

export async function adminGetSettings(): Promise<SiteSettings> {
  const admin = getAdminCreds();
  if (!admin) throw new Error('Not signed in as admin');
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: FN_HEADERS,
    body: JSON.stringify({ action: 'get_settings', admin }),
  });
  if (!res.ok) throw new Error('Failed to load settings');
  const json = await res.json();
  return json.data as SiteSettings;
}

export async function adminUpdateSettings(updates: Partial<SiteSettings>): Promise<void> {
  const admin = getAdminCreds();
  if (!admin) throw new Error('Not signed in as admin');
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: FN_HEADERS,
    body: JSON.stringify({ action: 'update_settings', admin, payload: updates }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Failed to save settings');
  }
}

export async function adminListContent(): Promise<SiteContent[]> {
  const admin = getAdminCreds();
  if (!admin) throw new Error('Not signed in as admin');
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: FN_HEADERS,
    body: JSON.stringify({ action: 'list_content', admin }),
  });
  if (!res.ok) throw new Error('Failed to load content');
  const json = await res.json();
  return json.data as SiteContent[];
}

export async function adminUpsertContent(row: Partial<SiteContent> & { section: string; title: string }): Promise<string> {
  const admin = getAdminCreds();
  if (!admin) throw new Error('Not signed in as admin');
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: FN_HEADERS,
    body: JSON.stringify({ action: 'upsert_content', admin, payload: row }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Failed to save content');
  }
  const json = await res.json();
  return json.id;
}

export async function adminDeleteContent(id: string): Promise<void> {
  const admin = getAdminCreds();
  if (!admin) throw new Error('Not signed in as admin');
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: FN_HEADERS,
    body: JSON.stringify({ action: 'delete_content', admin, payload: { id } }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Failed to delete content');
  }
}
