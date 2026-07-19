import { Zap, ShieldCheck, Clock, Headphones, Star, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import { useSite, contentBySection } from '../lib/site-context';

const ICON_FALLBACKS: Record<string, any> = {
  Zap, ShieldCheck, Clock, Headphones,
};

function resolveIcon(name?: string | null) {
  if (!name) return Zap;
  const fromLib = (Icons as any)[name];
  return fromLib || ICON_FALLBACKS[name] || Zap;
}

export function Features() {
  const { settings, content } = useSite();
  const items = contentBySection(content, 'feature');
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why shop with {settings.site_name}</h2>
          <p className="mt-2 text-sm text-slate-500">Trusted by 50,000+ customers across 30+ countries.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => {
            const Icon = resolveIcon(it.meta?.icon);
            return (
              <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{it.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{it.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Steps() {
  const { content } = useSite();
  const steps = contentBySection(content, 'step');
  return (
    <section id="how-it-works" className="bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How it works</h2>
          <p className="mt-2 text-sm text-slate-500">Three simple steps to get your digital product.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.id} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-3xl font-extrabold text-emerald-500/30">{s.meta?.n || s.sort_order + 1}</span>
              <h3 className="mt-2 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const { content } = useSite();
  const reviews = contentBySection(content, 'testimonial');
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Loved by customers</h2>
          <p className="mt-2 text-sm text-slate-500">Over 50,000 five-star reviews and counting.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {reviews.map((r) => {
            const rating = Number(r.meta?.rating) || 5;
            const role = r.meta?.role || 'Verified buyer';
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-600">"{r.body}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {r.title[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const { content } = useSite();
  const faqs = contentBySection(content, 'faq');
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-semibold text-slate-900">{f.title}</span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <p className="mt-2 text-sm text-slate-600">{f.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA({ onShop }: { onShop: () => void }) {
  const { settings } = useSite();
  return (
    <section className="bg-gradient-to-br from-emerald-600 to-cyan-600 py-14 text-white sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Ready to shop?</h2>
        <p className="mt-2 text-sm text-emerald-50">Browse our catalog and get instant delivery on every order.</p>
        <button
          onClick={onShop}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50 active:scale-95"
        >
          <Zap className="h-4 w-4" />
          {settings.hero_cta_label}
        </button>
      </div>
    </section>
  );
}
