import { Zap, ShieldCheck, Clock, Headphones, Star, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function Features() {
  const items = [
    { icon: Zap, title: 'Instant delivery', text: 'Receive your digital products within seconds of payment.' },
    { icon: ShieldCheck, title: 'Secure payments', text: 'Encrypted checkout with multiple payment options.' },
    { icon: Clock, title: '24/7 availability', text: 'Shop anytime — our automated system never sleeps.' },
    { icon: Headphones, title: 'Friendly support', text: 'Real humans ready to help via WhatsApp and email.' },
  ];
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why shop with VoltStore</h2>
          <p className="mt-2 text-sm text-slate-500">Trusted by 50,000+ customers across 30+ countries.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{it.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Steps() {
  const steps = [
    { n: '01', t: 'Choose your product', d: 'Browse our catalog and pick the digital product you need.' },
    { n: '02', t: 'Checkout securely', d: 'Pay with card, PayPal, crypto, or mobile wallet.' },
    { n: '03', t: 'Get instant delivery', d: 'Your product is delivered to your email immediately.' },
  ];
  return (
    <section id="how-it-works" className="bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How it works</h2>
          <p className="mt-2 text-sm text-slate-500">Three simple steps to get your digital product.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-3xl font-extrabold text-emerald-500/30">{s.n}</span>
              <h3 className="mt-2 font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const reviews = [
    { name: 'Aisha K.', role: 'Verified buyer', text: 'Got my Netflix subscription in under a minute. Best price I found anywhere!', rating: 5 },
    { name: 'Marco D.', role: 'Verified buyer', text: 'Mobile Legends diamonds arrived instantly. Will buy again.', rating: 5 },
    { name: 'Sara P.', role: 'Verified buyer', text: 'Customer support helped me pick the right Steam card. Super friendly.', rating: 5 },
  ];
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Loved by customers</h2>
          <p className="mt-2 text-sm text-slate-500">Over 50,000 five-star reviews and counting.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600">"{r.text}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {r.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const faqs = [
    { q: 'How fast is delivery?', a: 'Most products are delivered within 60 seconds of payment confirmation. Some require manual verification and may take up to 10 minutes.' },
    { q: 'What payment methods do you accept?', a: 'We accept major credit/debit cards, PayPal, crypto (BTC, ETH, USDT), and mobile wallets like bKash and GCash.' },
    { q: 'Can I get a refund?', a: 'Yes — if a product fails to deliver and we cannot resolve the issue within 24 hours, we issue a full refund.' },
    { q: 'Is my payment secure?', a: 'All payments are processed over encrypted connections. We never store your card details.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-semibold text-slate-900">{f.q}</span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <p className="mt-2 text-sm text-slate-600">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA({ onShop }: { onShop: () => void }) {
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
          Browse catalog
        </button>
      </div>
    </section>
  );
}
