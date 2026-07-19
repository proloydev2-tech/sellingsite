import { Zap, ShieldCheck, Clock, Sparkles, Star } from 'lucide-react';

type Props = { onShop: () => void };

export default function Hero({ onShop }: Props) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-20 top-10 h-72 w-72 animate-pulse-slow rounded-full bg-emerald-500 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 animate-pulse-slow rounded-full bg-cyan-500 blur-3xl [animation-delay:1.5s]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Instant digital delivery
          </span>
          <h1 className="mt-5 animate-fade-up text-4xl font-extrabold tracking-tight [animation-delay:0.1s] sm:text-5xl lg:text-6xl">
            Digital products, <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">delivered instantly</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl animate-fade-up text-base text-slate-300 [animation-delay:0.2s] sm:text-lg">
            Game top-ups, streaming subscriptions, software licenses, and gift cards — all at the best prices, delivered to your inbox in seconds.
          </p>
          <div className="mt-7 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:0.3s] sm:flex-row">
            <button
              onClick={onShop}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 hover:shadow-emerald-400/40 active:scale-95 sm:w-auto"
            >
              <Zap className="h-4 w-4 transition group-hover:scale-110" />
              Shop now
            </button>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:w-auto"
            >
              How it works
            </a>
          </div>
          <div className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300 [animation-delay:0.4s]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Secure payments
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-400" />
              24/7 instant delivery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              50k+ happy customers
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
