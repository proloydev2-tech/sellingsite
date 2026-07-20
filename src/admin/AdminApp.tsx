import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Tags,
  Receipt,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Loader2,
  Star,
  MessageSquare,
  LogOut,
  CheckCircle2,
  XCircle,
  Settings,
  Save,
  GripVertical,
  UserCog,
  Plug,
  Mail,
  KeyRound,
  Send,
  MessageCircle,
} from 'lucide-react';
import { supabase, type Category, type Product, type Variant, type Review } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { useAuth, getAdminCreds } from '../lib/auth';
import {
  adminGetSettings, adminUpdateSettings, adminListContent, adminUpsertContent, adminDeleteContent,
  type SiteSettings, type SiteContent,
} from '../lib/site';

type Props = { onExit: () => void };
type Tab = 'dashboard' | 'products' | 'categories' | 'orders' | 'reviews' | 'site' | 'admins' | 'integrations';

const TAB_FROM_HASH: Record<string, Tab> = {
  '': 'dashboard',
  dashboard: 'dashboard',
  products: 'products',
  categories: 'categories',
  orders: 'orders',
  reviews: 'reviews',
  site: 'site',
  admins: 'admins',
  integrations: 'integrations',
};

function parseAdminTab(): Tab {
  const h = window.location.hash.replace(/^#\/?admin\/?/, '').split('?')[0];
  return TAB_FROM_HASH[h] || 'dashboard';
}

function setAdminTabInHash(t: Tab) {
  const sub = t === 'dashboard' ? 'dashboard' : t;
  window.location.hash = `/admin/${sub}`;
}

export default function AdminApp({ onExit }: Props) {
  const { adminUser, adminRole, signOutAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>(parseAdminTab);

  useEffect(() => {
    const onHash = () => setTab(parseAdminTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    setAdminTabInHash(t);
  };
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, Variant[]>>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: p }, { data: v }, { data: o }, { data: oi }, { data: r }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('product_variants').select('*').order('sort_order'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*'),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
    ]);
    setCategories(c || []);
    setProducts(p || []);
    const map: Record<string, Variant[]> = {};
    (v || []).forEach((x) => {
      if (!map[x.product_id]) map[x.product_id] = [];
      map[x.product_id].push(x);
    });
    setVariantsByProduct(map);
    setOrders(o || []);
    setOrderItems(oi || []);
    setReviews((r as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    return {
      revenue,
      orders: orders.length,
      products: products.length,
      categories: categories.length,
      reviews: reviews.length,
    };
  }, [orders, products, categories, reviews]);

  const handleExit = () => {
    onExit();
  };

  const handleAdminLogout = () => {
    signOutAdmin();
    onExit();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExit}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Store</span>
            </button>
            <h1 className="text-base font-bold text-slate-900">Admin panel</h1>
            {adminUser && (
              <span className="hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 sm:inline">
                @{adminUser} {adminRole === 'owner' ? '· owner' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            <TabBtn icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active={tab === 'dashboard'} onClick={() => switchTab('dashboard')} />
            <TabBtn icon={<Package className="h-4 w-4" />} label="Products" active={tab === 'products'} onClick={() => switchTab('products')} />
            <TabBtn icon={<Tags className="h-4 w-4" />} label="Categories" active={tab === 'categories'} onClick={() => switchTab('categories')} />
            <TabBtn icon={<Receipt className="h-4 w-4" />} label="Orders" active={tab === 'orders'} onClick={() => switchTab('orders')} />
            <TabBtn icon={<MessageSquare className="h-4 w-4" />} label="Reviews" active={tab === 'reviews'} onClick={() => switchTab('reviews')} />
            <TabBtn icon={<Settings className="h-4 w-4" />} label="Site" active={tab === 'site'} onClick={() => switchTab('site')} />
            <TabBtn icon={<UserCog className="h-4 w-4" />} label="Admins" active={tab === 'admins'} onClick={() => switchTab('admins')} />
            <TabBtn icon={<Plug className="h-4 w-4" />} label="Integrations" active={tab === 'integrations'} onClick={() => switchTab('integrations')} />
            <button
              onClick={handleAdminLogout}
              className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              title="Sign out of admin"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="grid place-items-center py-20 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : tab === 'dashboard' ? (
          <Dashboard stats={stats} orders={orders} orderItems={orderItems} reviews={reviews} />
        ) : tab === 'products' ? (
          <ProductsAdmin
            categories={categories}
            products={products}
            variantsByProduct={variantsByProduct}
            onChange={load}
          />
        ) : tab === 'categories' ? (
          <CategoriesAdmin categories={categories} products={products} onChange={load} />
        ) : tab === 'orders' ? (
          <OrdersAdmin orders={orders} orderItems={orderItems} onChange={load} />
        ) : tab === 'reviews' ? (
          <ReviewsAdmin reviews={reviews} products={products} onChange={load} />
        ) : tab === 'admins' ? (
          <AdminsAdmin adminRole={adminRole} currentUsername={adminUser} />
        ) : tab === 'integrations' ? (
          <IntegrationsAdmin adminRole={adminRole} />
        ) : (
          <SiteAdmin />
        )}
      </main>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Dashboard({ stats, orders, orderItems, reviews }: { stats: any; orders: any[]; orderItems: any[]; reviews: Review[] }) {
  const recent = orders.slice(0, 5);
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    orderItems.forEach((i) => {
      if (!counts[i.product_id]) counts[i.product_id] = { name: i.product_name, qty: 0, revenue: 0 };
      counts[i.product_id].qty += i.quantity;
      counts[i.product_id].revenue += Number(i.price) * i.quantity;
    });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orderItems]);

  const recentReviews = reviews.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat icon={<DollarSign className="h-5 w-5" />} label="Revenue" value={formatPrice(stats.revenue)} color="emerald" />
        <Stat icon={<ShoppingCart className="h-5 w-5" />} label="Orders" value={stats.orders} color="blue" />
        <Stat icon={<Package className="h-5 w-5" />} label="Products" value={stats.products} color="amber" />
        <Stat icon={<Tags className="h-5 w-5" />} label="Categories" value={stats.categories} color="rose" />
        <Stat icon={<MessageSquare className="h-5 w-5" />} label="Reviews" value={stats.reviews} color="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Recent orders</h3>
          <ul className="mt-3 space-y-2">
            {recent.length === 0 ? (
              <li className="text-sm text-slate-500">No orders yet.</li>
            ) : (
              recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
                  <div>
                    <p className="font-mono font-semibold text-slate-900">{o.order_number}</p>
                    <p className="text-xs text-slate-500">{o.customer_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatPrice(Number(o.total))}</p>
                    <p className="text-xs text-emerald-600">{o.status}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Top products
          </h3>
          <ul className="mt-3 space-y-2">
            {topProducts.length === 0 ? (
              <li className="text-sm text-slate-500">No sales yet.</li>
            ) : (
              topProducts.map((p, i) => (
                <li key={i} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.qty} sold</p>
                  </div>
                  <p className="font-bold text-slate-900">{formatPrice(p.revenue)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          Recent reviews
        </h3>
        <ul className="mt-3 space-y-2">
          {recentReviews.length === 0 ? (
            <li className="text-sm text-slate-500">No reviews yet.</li>
          ) : (
            recentReviews.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 border-b border-slate-100 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{r.author_name}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">{r.comment}</p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                  ))}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function ReviewsAdmin({ reviews, products, onChange }: { reviews: Review[]; products: Product[]; onChange: () => void }) {
  const toggleApprove = async (id: string, approved: boolean) => {
    await supabase.from('reviews').update({ approved: !approved }).eq('id', id);
    onChange();
  };
  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    onChange();
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Reviews ({reviews.length})</h2>
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
          </div>
        ) : (
          reviews.map((r) => {
            const product = products.find((p) => p.id === r.product_id);
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{r.author_name}</p>
                    <p className="text-xs text-slate-500">
                      on <span className="font-medium text-slate-700">{product?.name || 'Unknown product'}</span>
                      {' · '}
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {r.approved ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {r.approved ? 'Approved' : 'Hidden'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => toggleApprove(r.id, r.approved)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {r.approved ? 'Hide' : 'Approve'}
                  </button>
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${colors[color]}`}>{icon}</div>
      <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ProductsAdmin({
  categories,
  products,
  variantsByProduct,
  onChange,
}: {
  categories: Category[];
  products: Product[];
  variantsByProduct: Record<string, Variant[]>;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product and its variants?')) return;
    await supabase.from('product_variants').delete().eq('product_id', id);
    await supabase.from('products').delete().eq('id', id);
    onChange();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Products ({products.length})</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cat = categories.find((c) => c.id === p.category_id);
                const vs = variantsByProduct[p.id] || [];
                const cheapest = vs.length ? vs.reduce((m, v) => (v.price < m.price ? v : m), vs[0]) : null;
                return (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 overflow-hidden rounded bg-slate-100">
                          <img src={p.image_url || ''} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.provider}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{cat?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{vs.length}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {cheapest ? formatPrice(cheapest.price) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {p.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || creating) && (
        <ProductEditor
          product={editing}
          categories={categories}
          variants={editing ? variantsByProduct[editing.id] || [] : []}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function ProductEditor({
  product,
  categories,
  variants,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  variants: Variant[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    image_url: product?.image_url || '',
    provider: product?.provider || '',
    category_id: product?.category_id || categories[0]?.id || '',
    rating: product?.rating ?? 4.5,
    featured: product?.featured ?? false,
    sort_order: product?.sort_order ?? 0,
  });
  const [variantList, setVariantList] = useState<Variant[]>(
    variants.length
      ? variants
      : [{ id: '', product_id: '', label: 'Default', price: 0, original_price: null, sku: null, stock: 99, sort_order: 0 } as any],
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const slug =
        form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let productId = product?.id;
      if (product) {
        await supabase
          .from('products')
          .update({
            name: form.name,
            slug,
            description: form.description || null,
            image_url: form.image_url || null,
            provider: form.provider || null,
            category_id: form.category_id,
            rating: form.rating,
            featured: form.featured,
            sort_order: form.sort_order,
          })
          .eq('id', product.id);
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: form.name,
            slug,
            description: form.description || null,
            image_url: form.image_url || null,
            provider: form.provider || null,
            category_id: form.category_id,
            rating: form.rating,
            featured: form.featured,
            sort_order: form.sort_order,
          })
          .select('id')
          .single();
        if (error) throw error;
        productId = (data as any).id;
      }
      await supabase.from('product_variants').delete().eq('product_id', productId);
      const rows = variantList
        .filter((v) => v.label && v.price >= 0)
        .map((v, i) => ({
          product_id: productId,
          label: v.label,
          price: Number(v.price),
          original_price: v.original_price ? Number(v.original_price) : null,
          sku: v.sku || null,
          stock: Number(v.stock) || 0,
          sort_order: i,
        }));
      if (rows.length) await supabase.from('product_variants').insert(rows);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{product ? 'Edit product' : 'New product'}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Slug (optional)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
          <Input label="Provider" value={form.provider} onChange={(v) => setForm({ ...form, provider: v })} />
          <Select label="Category" value={form.category_id} onChange={(v) => setForm({ ...form, category_id: v })} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          <Input label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} full />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          <Input label="Rating" type="number" value={String(form.rating)} onChange={(v) => setForm({ ...form, rating: Number(v) })} />
          <Input label="Sort order" type="number" value={String(form.sort_order)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            <span className="text-sm font-medium text-slate-700">Featured</span>
          </label>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Variants</h3>
            <button
              onClick={() =>
                setVariantList([
                  ...variantList,
                  { id: '', product_id: '', label: '', price: 0, original_price: null, sku: null, stock: 99, sort_order: variantList.length } as any,
                ])
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add variant
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {variantList.map((v, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-4">
                <input
                  placeholder="Label"
                  value={v.label}
                  onChange={(e) => {
                    const next = [...variantList];
                    next[i] = { ...v, label: e.target.value };
                    setVariantList(next);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                />
                <input
                  placeholder="Price"
                  type="number"
                  value={v.price}
                  onChange={(e) => {
                    const next = [...variantList];
                    next[i] = { ...v, price: Number(e.target.value) };
                    setVariantList(next);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                />
                <input
                  placeholder="Original (optional)"
                  type="number"
                  value={v.original_price ?? ''}
                  onChange={(e) => {
                    const next = [...variantList];
                    next[i] = { ...v, original_price: e.target.value ? Number(e.target.value) : null };
                    setVariantList(next);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-1">
                  <input
                    placeholder="Stock"
                    type="number"
                    value={v.stock}
                    onChange={(e) => {
                      const next = [...variantList];
                      next[i] = { ...v, stock: Number(e.target.value) };
                      setVariantList(next);
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => setVariantList(variantList.filter((_, idx) => idx !== i))}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.name || !form.category_id}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoriesAdmin({
  categories,
  products,
  onChange,
}: {
  categories: Category[];
  products: Product[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Products in it will remain but become uncategorized.')) return;
    await supabase.from('categories').delete().eq('id', id);
    onChange();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Categories ({categories.length})</h2>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = products.filter((p) => p.category_id === c.id).length;
          return (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{count} products</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {c.description && <p className="mt-2 text-sm text-slate-600">{c.description}</p>}
            </div>
          );
        })}
      </div>

      {(editing || creating) && (
        <CategoryEditor
          category={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function CategoryEditor({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    icon: category?.icon || 'Package',
    description: category?.description || '',
    sort_order: category?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (category) {
        await supabase
          .from('categories')
          .update({
            name: form.name,
            slug,
            icon: form.icon,
            description: form.description || null,
            sort_order: form.sort_order,
          })
          .eq('id', category.id);
      } else {
        await supabase.from('categories').insert({
          name: form.name,
          slug,
          icon: form.icon,
          description: form.description || null,
          sort_order: form.sort_order,
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{category ? 'Edit category' : 'New category'}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Slug (optional)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
          <Input label="Icon (lucide name)" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
          <Input label="Sort order" type="number" value={String(form.sort_order)} onChange={(v) => setForm({ ...form, sort_order: Number(v) })} />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.name}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersAdmin({ orders, orderItems, onChange }: { orders: any[]; orderItems: any[]; onChange: () => void }) {
  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    onChange();
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Orders ({orders.length})</h2>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">No orders yet.</p>
          </div>
        ) : (
          orders.map((o) => {
            const items = orderItems.filter((i) => i.order_id === o.id);
            return (
              <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-900">{o.order_number}</p>
                    <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {o.customer_name} • {o.customer_email}
                      {o.customer_whatsapp ? ` • ${o.customer_whatsapp}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatPrice(Number(o.total))}</p>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="mt-1 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      <option value="paid">paid</option>
                      <option value="pending">pending</option>
                      <option value="fulfilled">fulfilled</option>
                      <option value="refunded">refunded</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  {items.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span>{i.product_name} ({i.variant_label}) × {i.quantity}</span>
                      <span className="font-medium text-slate-800">{formatPrice(Number(i.price) * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', full }: { label: string; value: string; onChange: (v: string) => void; type?: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SiteAdmin() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [section, setSection] = useState<'general' | 'hero' | 'footer' | 'features' | 'steps' | 'testimonials' | 'faq'>('general');
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([adminGetSettings(), adminListContent()]);
      setSettings(s);
      setContent(c);
    } catch (e: any) {
      setToast(e.message || 'Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      await adminUpdateSettings(settings);
      setToast('Settings saved');
    } catch (e: any) {
      setToast(e.message || 'Failed to save');
    }
    setSavingSettings(false);
    setTimeout(() => setToast(null), 2500);
  };

  const sectionContent = (s: string) => content.filter((c) => c.section === s).sort((a, b) => a.sort_order - b.sort_order);

  const upsert = async (row: Partial<SiteContent> & { section: string; title: string }) => {
    try {
      await adminUpsertContent(row);
      await load();
    } catch (e: any) {
      setToast(e.message || 'Failed to save');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await adminDeleteContent(id);
      await load();
    } catch (e: any) {
      setToast(e.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Failed to load settings. Make sure you are signed in as admin.</div>;
  }

  const subTabs: { id: typeof section; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'hero', label: 'Hero' },
    { id: 'footer', label: 'Footer' },
    { id: 'features', label: 'Features' },
    { id: 'steps', label: 'Steps' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Site content</h2>
        <div className="flex gap-1 overflow-x-auto">
          {subTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                section === t.id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          {toast}
        </div>
      )}

      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        This tab manages storefront content (hero, footer, features, testimonials, FAQ). For Google OAuth,
        RupantorPay, and SMTP settings, use the Integrations tab.
      </p>

      {(section === 'general' || section === 'hero' || section === 'footer') && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {section === 'general' && (
              <>
                <Input label="Site name" value={settings.site_name} onChange={(v) => setSettings({ ...settings, site_name: v })} />
                <Input label="Tagline" value={settings.tagline} onChange={(v) => setSettings({ ...settings, tagline: v })} />
                <Input label="Currency code" value={settings.currency} onChange={(v) => setSettings({ ...settings, currency: v })} />
                <Input label="Contact email" value={settings.contact_email} onChange={(v) => setSettings({ ...settings, contact_email: v })} />
                <Input label="Contact WhatsApp" value={settings.contact_whatsapp} onChange={(v) => setSettings({ ...settings, contact_whatsapp: v })} full />
              </>
            )}
            {section === 'hero' && (
              <>
                <Input label="Badge text" value={settings.hero_badge} onChange={(v) => setSettings({ ...settings, hero_badge: v })} full />
                <Input label="Title" value={settings.hero_title} onChange={(v) => setSettings({ ...settings, hero_title: v })} full />
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Subtitle</label>
                  <textarea
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <Input label="CTA button label" value={settings.hero_cta_label} onChange={(v) => setSettings({ ...settings, hero_cta_label: v })} full />
              </>
            )}
            {section === 'footer' && (
              <>
                <Input label="Footer tagline" value={settings.footer_tagline} onChange={(v) => setSettings({ ...settings, footer_tagline: v })} full />
                <Input label="Copyright text" value={settings.footer_copyright} onChange={(v) => setSettings({ ...settings, footer_copyright: v })} full />
                <Input label="Twitter URL" value={settings.social_twitter || ''} onChange={(v) => setSettings({ ...settings, social_twitter: v || null })} />
                <Input label="Instagram URL" value={settings.social_instagram || ''} onChange={(v) => setSettings({ ...settings, social_instagram: v || null })} />
                <Input label="GitHub URL" value={settings.social_github || ''} onChange={(v) => setSettings({ ...settings, social_github: v || null })} full />
              </>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        </div>
      )}

      {(section === 'features' || section === 'steps' || section === 'testimonials' || section === 'faq') && (
        <ContentListEditor
          section={section}
          rows={sectionContent(section)}
          onUpsert={upsert}
          onDelete={remove}
        />
      )}
    </div>
  );
}

function ContentListEditor({
  section,
  rows,
  onUpsert,
  onDelete,
}: {
  section: string;
  rows: SiteContent[];
  onUpsert: (row: Partial<SiteContent> & { section: string; title: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const label = section === 'faq' ? 'Question' : 'Title';
  const bodyLabel = section === 'faq' ? 'Answer' : section === 'testimonials' ? 'Quote' : 'Description';
  const needsMeta = section === 'features' || section === 'steps' || section === 'testimonials';

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No items yet. Add one below.
        </div>
      )}
      {rows.map((r) => (
        <ContentRowEditor key={r.id} row={r} section={section} label={label} bodyLabel={bodyLabel} needsMeta={needsMeta} onUpsert={onUpsert} onDelete={onDelete} />
      ))}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">Add new</p>
        <ContentRowEditor section={section} label={label} bodyLabel={bodyLabel} needsMeta={needsMeta} onUpsert={onUpsert} onDelete={onDelete} />
      </div>
    </div>
  );
}

function ContentRowEditor({
  row,
  section,
  label,
  bodyLabel,
  needsMeta,
  onUpsert,
  onDelete,
}: {
  row?: SiteContent;
  section: string;
  label: string;
  bodyLabel: string;
  needsMeta: boolean;
  onUpsert: (row: Partial<SiteContent> & { section: string; title: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(row?.title || '');
  const [body, setBody] = useState(row?.body || '');
  const [icon, setIcon] = useState<string>(row?.meta?.icon || '');
  const [n, setN] = useState<string>(row?.meta?.n || '');
  const [rating, setRating] = useState<string>(row?.meta?.rating ? String(row.meta.rating) : '5');
  const [role, setRole] = useState<string>(row?.meta?.role || 'Verified buyer');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const meta: Record<string, any> = {};
    if (section === 'features' && icon) meta.icon = icon;
    if (section === 'steps' && n) meta.n = n;
    if (section === 'testimonials') {
      meta.rating = Number(rating) || 5;
      meta.role = role;
    }
    await onUpsert({
      id: row?.id,
      section,
      title,
      body: body || null,
      sort_order: row?.sort_order ?? 0,
      meta: Object.keys(meta).length ? meta : null,
    });
    setSaving(false);
    if (!row) {
      setTitle('');
      setBody('');
      setIcon('');
      setN('');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        {section === 'features' && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Icon (lucide name)</label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Zap"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        )}
        {section === 'steps' && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Step number</label>
            <input
              value={n}
              onChange={(e) => setN(e.target.value)}
              placeholder="01"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        )}
        {section === 'testimonials' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Rating (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{bodyLabel}</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {row && onDelete && (
          <button
            onClick={() => onDelete(row.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {row ? 'Save' : 'Add'}
        </button>
      </div>
    </div>
  );
}

// ---------------- Admins management ----------------

type AdminRow = {
  id: string;
  username: string;
  email: string | null;
  role: 'owner' | 'admin';
  created_at: string;
};

async function adminConfigCall(action: string, payload: Record<string, unknown> = {}) {
  const admin = getAdminCreds();
  if (!admin) throw new Error('Not signed in as admin');
  const { data, error } = await supabase.functions.invoke('admin-config', {
    body: { action, admin, payload },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

function AdminsAdmin({ adminRole, currentUsername }: { adminRole: 'owner' | 'admin' | null; currentUsername: string | null }) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminConfigCall('list_admins');
      setAdmins(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load admins');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await adminConfigCall('create_admin', {
        username: form.username,
        password: form.password,
        email: form.email,
      });
      setForm({ username: '', password: '', email: '' });
      setToast('Admin created');
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to create admin');
    }
    setCreating(false);
    setTimeout(() => setToast(null), 2500);
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm('Delete this admin account?')) return;
    try {
      await adminConfigCall('delete_admin', { id });
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to delete admin');
    }
  };

  const isOwner = adminRole === 'owner';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Admin accounts ({admins.length})</h2>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      )}
      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{toast}</div>
      )}

      {!isOwner && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          Only the owner account can create or delete admin accounts. You are signed in as an admin.
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-12 text-slate-400"><Loader2 className="h-7 w-7 animate-spin" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    @{a.username}
                    {a.username === currentUsername && <span className="ml-2 text-xs text-emerald-600">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.role === 'owner' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {a.role === 'owner' ? <CheckCircle2 className="h-3 w-3" /> : <UserCog className="h-3 w-3" />}
                      {a.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {isOwner && a.role !== 'owner' && (
                      <button
                        onClick={() => deleteAdmin(a.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isOwner && (
        <form onSubmit={createAdmin} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Plus className="h-4 w-4" />
            Create new admin
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Username</label>
              <input
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="newadmin"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
              <input
                required
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="set a password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email (optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="admin@voltstore.shop"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create admin
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------------- Integrations (Google, RupantorPay, SMTP) ----------------

function IntegrationsAdmin({ adminRole }: { adminRole: 'owner' | 'admin' | null }) {
  const isOwner = adminRole === 'owner';
  const [smtp, setSmtp] = useState<any>(null);
  const [google, setGoogle] = useState<any>(null);
  const [rupantor, setRupantor] = useState<any>(null);
  const [telegram, setTelegram] = useState<any>(null);
  const [support, setSupport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, g, r, t, sup] = await Promise.all([
        adminConfigCall('get_smtp').catch(() => null),
        adminConfigCall('get_google').catch(() => null),
        adminConfigCall('get_rupantorpay').catch(() => null),
        adminConfigCall('get_telegram').catch(() => null),
        adminConfigCall('get_support').catch(() => null),
      ]);
      setSmtp(s?.data || null);
      setGoogle(g?.data || null);
      setRupantor(r?.data || null);
      setTelegram(t?.data || null);
      setSupport(sup?.data || null);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (key: string, action: string, payload: Record<string, unknown>) => {
    setSavingKey(key);
    setError(null);
    try {
      await adminConfigCall(action, payload);
      setToast('Saved');
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    }
    setSavingKey(null);
    setTimeout(() => setToast(null), 2500);
  };

  const testTelegram = async () => {
    setTestingTelegram(true);
    setError(null);
    try {
      await adminConfigCall('test_telegram', {});
      setToast('Test message sent');
    } catch (e: any) {
      setError(e.message || 'Test failed');
    }
    setTestingTelegram(false);
    setTimeout(() => setToast(null), 2500);
  };

  if (loading) {
    return <div className="grid place-items-center py-12 text-slate-400"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Integrations</h2>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      )}
      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{toast}</div>
      )}

      {!isOwner && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          Only the owner account can edit integration keys. You are signed in as an admin.
        </div>
      )}

      {/* Google OAuth */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Google OAuth</h3>
            <p className="text-xs text-slate-500">Client ID & secret for "Continue with Google" sign-in.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Client ID</label>
            <input
              disabled={!isOwner}
              value={google?.client_id || ''}
              onChange={(e) => setGoogle({ ...google, client_id: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="xxxxx.apps.googleusercontent.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Client secret</label>
            <input
              disabled={!isOwner}
              type="password"
              value={google?.client_secret || ''}
              onChange={(e) => setGoogle({ ...google, client_secret: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="GOCSPX-xxxxx"
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              disabled={!isOwner}
              checked={!!google?.enabled}
              onChange={(e) => setGoogle({ ...google, enabled: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">Enable Google sign-in</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={!isOwner || savingKey === 'google'}
            onClick={() => save('google', 'update_google', {
              client_id: google?.client_id || '',
              client_secret: google?.client_secret || '',
              enabled: !!google?.enabled,
            })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
          >
            {savingKey === 'google' && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Note: to activate Google sign-in you also need to enable the Google provider in your Supabase dashboard
          (Authentication → Providers → Google) with the same client ID/secret. This form stores the values
          here for reference; the actual OAuth flow reads from Supabase project config.
        </p>
      </div>

      {/* RupantorPay */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">RupantorPay</h3>
            <p className="text-xs text-slate-500">API key for the RupantorPay payment gateway (bKash, Nagad, Rocket, cards).</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">API key</label>
            <input
              disabled={!isOwner}
              type="password"
              value={rupantor?.api_key || ''}
              onChange={(e) => setRupantor({ ...rupantor, api_key: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="rupantorpay live api key"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled={!isOwner}
              checked={!!rupantor?.enabled}
              onChange={(e) => setRupantor({ ...rupantor, enabled: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">Enabled</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={!isOwner || savingKey === 'rupantor'}
            onClick={() => save('rupantor', 'update_rupantorpay', {
              api_key: rupantor?.api_key || '',
              enabled: !!rupantor?.enabled,
            })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
          >
            {savingKey === 'rupantor' && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Tip: for the change to take effect immediately on the checkout edge function, also set the
          <span className="font-mono"> RUPANTORPAY_API_KEY </span> secret in your Supabase project settings.
          Saving here updates the database config used as a fallback.
        </p>
      </div>

      {/* SMTP */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">SMTP</h3>
            <p className="text-xs text-slate-500">SMTP server for sending order confirmation and verification code emails.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">SMTP host</label>
            <input
              disabled={!isOwner}
              value={smtp?.host || ''}
              onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Port</label>
            <input
              disabled={!isOwner}
              type="number"
              value={smtp?.port ?? 587}
              onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="587"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Username</label>
            <input
              disabled={!isOwner}
              value={smtp?.username || ''}
              onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="you@gmail.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
            <input
              disabled={!isOwner}
              type="password"
              value={smtp?.password || ''}
              onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="app password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">From email</label>
            <input
              disabled={!isOwner}
              type="email"
              value={smtp?.from_email || ''}
              onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="noreply@voltstore.shop"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">From name</label>
            <input
              disabled={!isOwner}
              value={smtp?.from_name || ''}
              onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="VoltStore"
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              disabled={!isOwner}
              checked={!!smtp?.secure}
              onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">Use SSL/TLS (port 465 typically uses this)</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={!isOwner || savingKey === 'smtp'}
            onClick={() => save('smtp', 'update_smtp', {
              host: smtp?.host || '',
              port: Number(smtp?.port) || 587,
              username: smtp?.username || '',
              password: smtp?.password || '',
              from_email: smtp?.from_email || '',
              from_name: smtp?.from_name || '',
              secure: !!smtp?.secure,
            })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
          >
            {savingKey === 'smtp' && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      {/* Telegram */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-50 text-sky-600">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Telegram notifications</h3>
            <p className="text-xs text-slate-500">Send order details to a Telegram chat/group/channel when a new order is placed.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Bot token</label>
            <input
              disabled={!isOwner}
              type="password"
              value={telegram?.bot_token || ''}
              onChange={(e) => setTelegram({ ...telegram, bot_token: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="123456789:ABC-DEF..."
            />
            <p className="mt-1 text-xs text-slate-500">Get this from <span className="font-medium">@BotFather</span> on Telegram.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Chat ID</label>
            <input
              disabled={!isOwner}
              value={telegram?.chat_id || ''}
              onChange={(e) => setTelegram({ ...telegram, chat_id: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="-1001234567890"
            />
            <p className="mt-1 text-xs text-slate-500">Channel: <span className="font-mono">-100…</span>. Group: negative. DM: your user ID.</p>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled={!isOwner}
              checked={!!telegram?.enabled}
              onChange={(e) => setTelegram({ ...telegram, enabled: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">Enabled</span>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            disabled={!isOwner || testingTelegram || !telegram?.bot_token || !telegram?.chat_id}
            onClick={testTelegram}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {testingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send test message
          </button>
          <button
            disabled={!isOwner || savingKey === 'telegram'}
            onClick={() => save('telegram', 'update_telegram', {
              bot_token: telegram?.bot_token || '',
              chat_id: telegram?.chat_id || '',
              enabled: !!telegram?.enabled,
            })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
          >
            {savingKey === 'telegram' && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p className="mb-1 font-semibold text-slate-700">Setup steps:</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>Open Telegram, search <span className="font-medium">@BotFather</span>, send <span className="font-mono">/newbot</span> and follow prompts to create a bot. Copy the bot token.</li>
            <li>Add the bot to your channel/group as an admin (or start a DM with the bot).</li>
            <li>Find the chat ID: forward a message from your chat to <span className="font-medium">@userinfobot</span> or use the Telegram Bot API <span className="font-mono">getUpdates</span> endpoint.</li>
            <li>Paste the bot token and chat ID here, enable, and click Save. Use "Send test message" to verify.</li>
          </ol>
        </div>
      </div>

      {/* Support channels */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Support widget</h3>
            <p className="text-xs text-slate-500">Floating support button on the homepage with free AI chat, Telegram, and WhatsApp shortcuts.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">AI welcome message</label>
            <textarea
              disabled={!isOwner}
              value={support?.ai_welcome || ''}
              onChange={(e) => setSupport({ ...support, ai_welcome: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="Hi! I am VoltBot, your free AI assistant..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">WhatsApp URL / number</label>
            <input
              disabled={!isOwner}
              value={support?.whatsapp_url || ''}
              onChange={(e) => setSupport({ ...support, whatsapp_url: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="https://wa.me/8801XXXXXXXXX"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Telegram URL / username</label>
            <input
              disabled={!isOwner}
              value={support?.telegram_url || ''}
              onChange={(e) => setSupport({ ...support, telegram_url: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-50"
              placeholder="@yourbot or https://t.me/yourbot"
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              disabled={!isOwner}
              checked={!!support?.ai_enabled}
              onChange={(e) => setSupport({ ...support, ai_enabled: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">Enable free AI chat (no API key needed)</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={!isOwner || savingKey === 'support'}
            onClick={() => save('support', 'update_support', {
              ai_enabled: !!support?.ai_enabled,
              ai_welcome: support?.ai_welcome || '',
              telegram_url: support?.telegram_url || '',
              whatsapp_url: support?.whatsapp_url || '',
            })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
          >
            {savingKey === 'support' && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          The AI chat is 100% free — it uses a built-in rule-based assistant that answers questions about your
          products, pricing, delivery, payments, refunds, and (if the customer is signed in) their order status.
          No external API key or billing is required.
        </p>
      </div>
    </div>
  );
}

