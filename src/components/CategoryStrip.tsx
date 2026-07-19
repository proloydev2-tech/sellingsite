import type { Category } from '../lib/supabase';
import * as Icons from 'lucide-react';

type Props = {
  categories: Category[];
  active: string | null;
  onSelect: (slug: string | null) => void;
};

export default function CategoryStrip({ categories, active, onSelect }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition ${
          active === null
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        All
      </button>
      {categories.map((c) => {
        const Icon = (Icons as any)[c.icon] as Icons.LucideIcon | undefined;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.slug)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              active === c.slug
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
