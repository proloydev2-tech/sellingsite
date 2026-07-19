import { ShoppingCart, Search, Zap, User } from 'lucide-react';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site-context';

type Props = {
  search: string;
  onSearch: (v: string) => void;
  onOpenCart: () => void;
  onNavigate: (view: { kind: 'home' } | { kind: 'category'; slug: string }) => void;
  onJumpCatalog: () => void;
  onAccount: () => void;
};

export default function Header({
  search,
  onSearch,
  onOpenCart,
  onNavigate,
  onJumpCatalog,
  onAccount,
}: Props) {
  const { count } = useCart();
  const { user } = useAuth();
  const { settings } = useSite();
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <button onClick={() => onNavigate({ kind: 'home' })} className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="text-left leading-tight">
            <p className="text-sm font-bold tracking-tight text-slate-900">{settings.site_name}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-600">{settings.tagline}</p>
          </div>
        </button>

        <div className="relative hidden max-w-xl flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search Netflix, Mobile Legends, Steam..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex-1 sm:hidden" />

        <button
          onClick={onJumpCatalog}
          className="hidden text-sm font-medium text-slate-700 transition hover:text-slate-900 md:inline-flex"
        >
          Catalog
        </button>

        <button
          onClick={onAccount}
          className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          aria-label="Account"
        >
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4" />}
        </button>

        <button
          onClick={onOpenCart}
          className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Cart</span>
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
