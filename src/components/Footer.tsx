import { Zap, Twitter, Github, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                <Zap className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <p className="font-bold text-slate-900">VoltStore</p>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Digital products delivered instantly, at the best prices.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="text-slate-400 hover:text-slate-700"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-slate-700"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-slate-700"><Github className="h-5 w-5" /></a>
            </div>
          </div>
          <FooterCol title="Shop" links={["Game top-ups", "Streaming", "Software", "Gift cards"]} />
          <FooterCol title="Support" links={["Help center", "Track order", "Refunds", "Contact"]} />
          <FooterCol title="Company" links={["About", "Careers", "Privacy", "Terms"]} />
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} VoltStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-500">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="transition hover:text-slate-900">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
