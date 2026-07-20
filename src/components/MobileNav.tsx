import { Home, Search, Heart, User, ShoppingBag } from 'lucide-react';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';

type Props = {
  onHome: () => void;
  onSearch: () => void;
  onFavorites: () => void;
  onAccount: () => void;
  onCart: () => void;
  active: 'home' | 'search' | 'favorites' | 'account' | 'cart';
};

export default function MobileNav({ onHome, onSearch, onFavorites, onAccount, onCart, active }: Props) {
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        <Item icon={<Home className="h-5 w-5" />} label="Home" active={active === 'home'} onClick={onHome} />
        <Item icon={<Search className="h-5 w-5" />} label="Search" active={active === 'search'} onClick={onSearch} />
        <Item icon={<Heart className="h-5 w-5" />} label="Saved" active={active === 'favorites'} onClick={onFavorites} />
        <Item icon={<ShoppingBag className="h-5 w-5" />} label="Cart" badge={count} active={active === 'cart'} onClick={onCart} />
        <Item
          icon={<User className="h-5 w-5" />}
          label={user ? 'Account' : 'Sign in'}
          active={active === 'account'}
          onClick={onAccount}
          avatar={user?.user_metadata?.avatar_url}
        />
      </div>
    </nav>
  );
}

function Item({
  icon,
  label,
  active,
  onClick,
  badge,
  avatar,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  avatar?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
        active ? 'text-emerald-600' : 'text-slate-500'
      }`}
    >
      <div className="relative">
        {avatar ? <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover" /> : icon}
        {badge && badge > 0 ? (
          <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
}
