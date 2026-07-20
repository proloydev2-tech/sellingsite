import { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, Receipt, Heart, User as UserIcon, Loader2, Package, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase, type Order, type OrderItem, type Product, type Review } from '../lib/supabase';
import { formatPrice } from '../lib/format';

type Props = {
  onExit: () => void;
  onOpenProduct: (slug: string) => void;
};

type Tab = 'orders' | 'favorites' | 'reviews' | 'profile';

export default function AccountPage({ onExit, onOpenProduct }: Props) {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: o }, { data: oi }, { data: favs }, { data: reviews }] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('order_items').select('*'),
        supabase
          .from('favorites')
          .select('product_id, products(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      setOrders((o as Order[]) || []);
      setOrderItems((oi as OrderItem[]) || []);
      setFavorites((favs || []).map((f: any) => f.products as Product).filter(Boolean));
      setMyReviews((reviews as Review[]) || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to store</span>
          </button>
          <h1 className="text-base font-semibold text-slate-900">My account</h1>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
            <img
              src={profile?.avatar_url || user?.user_metadata?.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <UserIcon className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900">
              {profile?.full_name || user?.user_metadata?.full_name || 'Member'}
            </p>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <TabBtn icon={<Receipt className="h-4 w-4" />} label="Orders" active={tab === 'orders'} onClick={() => setTab('orders')} />
          <TabBtn icon={<Heart className="h-4 w-4" />} label="Favorites" active={tab === 'favorites'} onClick={() => setTab('favorites')} />
          <TabBtn icon={<MessageSquare className="h-4 w-4" />} label="My reviews" active={tab === 'reviews'} onClick={() => setTab('reviews')} />
          <TabBtn icon={<UserIcon className="h-4 w-4" />} label="Profile" active={tab === 'profile'} onClick={() => setTab('profile')} />
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="grid place-items-center py-20 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : tab === 'orders' ? (
            <OrdersTab orders={orders} orderItems={orderItems} />
          ) : tab === 'favorites' ? (
            <FavoritesTab favorites={favorites} onOpenProduct={onOpenProduct} />
          ) : tab === 'reviews' ? (
            <ReviewsTab reviews={myReviews} />
          ) : (
            <ProfileTab />
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function OrdersTab({ orders, orderItems }: { orders: Order[]; orderItems: OrderItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-base font-medium text-slate-900">No orders yet</p>
        <p className="mt-1 text-sm text-slate-500">Your purchases will appear here.</p>
      </div>
    );
  }
  const statusColor = (s: string) => {
    const st = (s || '').toLowerCase();
    if (st === 'paid' || st === 'fulfilled') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (st === 'pending') return 'border-amber-200 bg-amber-50 text-amber-700';
    if (st === 'refunded' || st === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-700';
    return 'border-slate-200 bg-slate-50 text-slate-700';
  };
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const items = orderItems.filter((i) => i.order_id === o.id);
        const isOpen = expanded === o.id;
        const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
        return (
          <div key={o.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => setExpanded(isOpen ? null : o.id)}
              className="flex w-full flex-wrap items-start justify-between gap-3 p-5 text-left transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-slate-900">{o.order_number}</p>
                <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                  {o.payment_method ? ` · ${o.payment_method}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-slate-900">{formatPrice(Number(o.total))}</p>
                <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(o.status)}`}>
                  {o.status}
                </span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <Meta label="Order #" value={o.order_number} />
                  <Meta label="Date" value={new Date(o.created_at).toLocaleString()} />
                  <Meta label="Payment" value={o.payment_method || 'rupantorpay'} />
                  <Meta label="Status" value={o.status} />
                  {o.customer_name && <Meta label="Customer" value={o.customer_name} />}
                  {o.customer_email && <Meta label="Email" value={o.customer_email} />}
                  {o.customer_whatsapp && <Meta label="WhatsApp" value={o.customer_whatsapp} />}
                </div>
                <h4 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Items</h4>
                <ul className="space-y-2">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{i.product_name}</p>
                        <p className="text-xs text-slate-500">
                          {i.variant_label} × {i.quantity} · {formatPrice(Number(i.price))} each
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-slate-900">{formatPrice(Number(i.price) * i.quantity)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Processing fee</span>
                    <span>{formatPrice(0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatPrice(Number(o.total))}</span>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Status meanings: <b>pending</b> = awaiting payment, <b>paid</b> = payment confirmed, <b>fulfilled</b> = delivered, <b>refunded</b> = money returned.
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="truncate text-xs font-medium text-slate-700">{value}</p>
    </div>
  );
}

function FavoritesTab({ favorites, onOpenProduct }: { favorites: Product[]; onOpenProduct: (slug: string) => void }) {
  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Heart className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-base font-medium text-slate-900">No favorites yet</p>
        <p className="mt-1 text-sm text-slate-500">Tap the heart on any product to save it here.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {favorites.map((p) => (
        <button
          key={p.id}
          onClick={() => onOpenProduct(p.slug)}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="aspect-square overflow-hidden bg-slate-100">
            <img src={p.image_url || ''} alt={p.name} className="h-full w-full object-cover" />
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
            <p className="text-xs text-slate-500">{p.provider}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Account details</h3>
      <p className="mt-1 text-sm text-slate-500">
        Your profile is created automatically when you sign in. We store only your
        name, email, and phone number.
      </p>
      <div className="mt-4 space-y-2 text-sm">
        <Row label="Plan" value="Free member" />
        <Row label="Verified" value="Yes" />
        <Row label="Member since" value={new Date().toLocaleDateString()} />
      </div>
    </div>
  );
}

function ReviewsTab({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-base font-medium text-slate-900">No reviews yet</p>
        <p className="mt-1 text-sm text-slate-500">Reviews you write on products will appear here.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{r.author_name}</p>
              <p className="text-[11px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`}
                />
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
