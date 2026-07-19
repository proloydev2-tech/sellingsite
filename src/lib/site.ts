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

export const defaultContent: SiteContent[] = [
  { id: 'd-feature-1', section: 'feature', sort_order: 0, title: 'Instant delivery', body: 'Receive your digital products within seconds of payment.', meta: { icon: 'Zap' }, created_at: '' },
  { id: 'd-feature-2', section: 'feature', sort_order: 1, title: 'Secure payments', body: 'Encrypted checkout with multiple payment options.', meta: { icon: 'ShieldCheck' }, created_at: '' },
  { id: 'd-feature-3', section: 'feature', sort_order: 2, title: '24/7 availability', body: 'Our automated system never sleeps.', meta: { icon: 'Clock' }, created_at: '' },
  { id: 'd-feature-4', section: 'feature', sort_order: 3, title: 'Friendly support', body: 'Real humans ready to help via WhatsApp and email.', meta: { icon: 'Headphones' }, created_at: '' },
  { id: 'd-step-1', section: 'step', sort_order: 0, title: 'Choose your product', body: 'Browse our catalog and pick the digital product you need.', meta: { n: '01' }, created_at: '' },
  { id: 'd-step-2', section: 'step', sort_order: 1, title: 'Checkout securely', body: 'Pay with bKash, Nagad, Rocket, or card via RupantorPay.', meta: { n: '02' }, created_at: '' },
  { id: 'd-step-3', section: 'step', sort_order: 2, title: 'Get instant delivery', body: 'Your product is delivered to your email immediately.', meta: { n: '03' }, created_at: '' },
  { id: 'd-test-1', section: 'testimonial', sort_order: 0, title: 'Aisha K.', body: 'Got my Netflix subscription in under a minute. Best price I found anywhere!', meta: { role: 'Verified buyer', rating: 5 }, created_at: '' },
  { id: 'd-test-2', section: 'testimonial', sort_order: 1, title: 'Marco D.', body: 'Mobile Legends diamonds arrived instantly. Will buy again.', meta: { role: 'Verified buyer', rating: 5 }, created_at: '' },
  { id: 'd-test-3', section: 'testimonial', sort_order: 2, title: 'Sara P.', body: 'Customer support helped me pick the right Steam card. Super friendly.', meta: { role: 'Verified buyer', rating: 5 }, created_at: '' },
  { id: 'd-faq-1', section: 'faq', sort_order: 0, title: 'How fast is delivery?', body: 'Most products are delivered within 60 seconds of payment confirmation. Some require manual verification and may take up to 10 minutes.', meta: null, created_at: '' },
  { id: 'd-faq-2', section: 'faq', sort_order: 1, title: 'What payment methods do you accept?', body: 'We accept bKash, Nagad, Rocket, and major cards via RupantorPay.', meta: null, created_at: '' },
  { id: 'd-faq-3', section: 'faq', sort_order: 2, title: 'Can I get a refund?', body: 'If a product fails to deliver and we cannot resolve the issue within 24 hours, we issue a full refund.', meta: null, created_at: '' },
  { id: 'd-faq-4', section: 'faq', sort_order: 3, title: 'Is my payment secure?', body: 'All payments are processed over encrypted connections via RupantorPay. We never store your card details.', meta: null, created_at: '' },
];

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) return defaultSettings;
    return data as SiteSettings;
  } catch {
    return defaultSettings;
  }
}

export async function fetchSiteContent(): Promise<SiteContent[]> {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('section')
      .order('sort_order');
    if (error || !data || data.length === 0) return defaultContent;
    return data as SiteContent[];
  } catch {
    return defaultContent;
  }
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
