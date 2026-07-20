import type { Category } from '../lib/supabase';
import * as Icons from 'lucide-react';

type Props = {
  categories: Category[];
  active: string | null;
  onSelect: (slug: string | null) => void;
};

export default function CategoryStrip({ categories, active, onSelect }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          active === null
            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
        }`}
      >
        All
      </button>
      {categories.map((c) => {
        const Icon = (Icons as any)[c.icon] as Icons.LucideIcon | undefined;
        const isActive = active === c.slug;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.slug)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
            }`}
          >
            {Icon ? <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} /> : null}
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
