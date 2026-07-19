import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { supabase, supabaseConfigured, type Category, type Product, type Variant } from './lib/supabase';
import { CartProvider } from './lib/cart';
import { AuthProvider, useAuth } from './lib/auth';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryStrip from './components/CategoryStrip';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { Features, Steps, Testimonials, FAQ, CTA } from './components/Sections';
import AdminApp from './admin/AdminApp';
import AdminLogin from './components/AdminLogin';
import LoginPage from './components/LoginPage';
import AccountPage from './components/AccountPage';
import MobileNav from './components/MobileNav';
import ConfigError from './components/ConfigError';
import PaymentReturn from './components/PaymentReturn';

type View = { kind: 'home' } | { kind: 'category'; slug: string };
type Route = 'store' | 'admin' | 'login' | 'account';

function useHashRoute(): { route: Route; navigate: (r: Route) => void } {
  const parse = (): Route => {
    const h = window.location.hash.replace(/^#\/?/, '');
    if (h === 'admin') return 'admin';
    if (h === 'login') return 'login';
    if (h === 'account') return 'account';
    return 'store';
  };
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const onHash = () => setRoute(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r: Route) => {
    if (r === 'store') {
      if (window.location.hash) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
      setRoute('store');
    } else {
      window.location.hash = `/${r}`;
    }
  };

  return { route, navigate };
}

function Store() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, Variant[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: 'home' });
  const [openProductSlug, setOpenProductSlug] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [paymentReturnOpen, setPaymentReturnOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const p = new URLSearchParams(window.location.search);
    return p.has('payment') || p.has('transactionId') || p.has('transaction_id') || p.has('tx');
  });
  const { route, navigate } = useHashRoute();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: cats }, { data: prods }, { data: variants }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('products').select('*').order('sort_order'),
        supabase.from('product_variants').select('*').order('sort_order'),
      ]);
      if (cancelled) return;
      setCategories(cats || []);
      setProducts(prods || []);
      const map: Record<string, Variant[]> = {};
      (variants || []).forEach((v) => {
        if (!map[v.product_id]) map[v.product_id] = [];
        map[v.product_id].push(v);
      });
      setVariantsByProduct(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = activeCat
        ? categories.find((c) => c.slug === activeCat)?.id === p.category_id
        : true;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.provider || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, categories, activeCat, search]);

  const openProduct = useMemo(() => {
    if (!openProductSlug) return null;
    return products.find((p) => p.slug === openProductSlug) || null;
  }, [openProductSlug, products]);

  const handleNavigate = (v: View) => {
    setView(v);
    if (v.kind === 'category') setActiveCat(v.slug);
    else setActiveCat(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openProductHandler = (slug: string) => {
    if (route !== 'store') navigate('store');
    setTimeout(() => setOpenProductSlug(slug), 50);
  };

  if (route === 'admin') {
    return isAdmin ? (
      <AdminApp onExit={() => navigate('store')} />
    ) : (
      <AdminLogin onClose={() => navigate('store')} />
    );
  }
  if (route === 'login') return <LoginPage onClose={() => navigate('store')} />;
  if (route === 'account') {
    return user ? (
      <AccountPage onExit={() => navigate('store')} onOpenProduct={openProductHandler} />
    ) : (
      <LoginPage onClose={() => navigate('store')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 lg:pb-0">
      <Header
        search={search}
        onSearch={setSearch}
        onOpenCart={() => setCartOpen(true)}
        onNavigate={handleNavigate}
        onJumpCatalog={jumpCatalog}
        onAccount={() => navigate(user ? 'account' : 'login')}
      />

      <div className="border-b border-slate-200 bg-white px-4 py-2 sm:hidden">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {view.kind === 'home' && <Hero onShop={jumpCatalog} />}

      <main id="catalog" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {activeCat ? categories.find((c) => c.slug === activeCat)?.name : 'All products'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''} available for instant delivery
            </p>
          </div>
        </div>

        <div className="mb-6">
          <CategoryStrip
            categories={categories}
            active={activeCat}
            onSelect={(slug) => {
              setActiveCat(slug);
              setView({ kind: 'home' });
            }}
          />
        </div>

        <ProductGrid
          products={filtered}
          variantsByProduct={variantsByProduct}
          onOpen={setOpenProductSlug}
          onLoginRequired={() => navigate('login')}
          loading={loading}
        />
      </main>

      <Features />
      <Steps />
      <Testimonials />
      <FAQ />
      <CTA onShop={jumpCatalog} />

      <Footer />

      <ProductDetail
        product={openProduct}
        variants={openProduct ? variantsByProduct[openProduct.id] || [] : []}
        onClose={() => setOpenProductSlug(null)}
        onAdded={() => setToast('Added to cart')}
        onLoginRequired={() => navigate('login')}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={(no) => setToast(`Order ${no} confirmed`)}
      />

      <Toast message={toast} onDone={() => setToast(null)} />

      <MobileNav
        active="home"
        onHome={() => {
          setActiveCat(null);
          setView({ kind: 'home' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSearch={jumpCatalog}
        onFavorites={() => navigate(user ? 'account' : 'login')}
        onAccount={() => navigate(user ? 'account' : 'login')}
        onCart={() => setCartOpen(true)}
      />
      {paymentReturnOpen ? <PaymentReturn onDismiss={() => setPaymentReturnOpen(false)} /> : null}
    </div>
  );
}

export default function App() {
  if (!supabaseConfigured) return <ConfigError />;
  return (
    <AuthProvider>
      <CartProvider>
        <Store />
      </CartProvider>
    </AuthProvider>
  );
}
