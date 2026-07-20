import { Zap, Twitter, Github, Instagram } from 'lucide-react';
import { useSite, contentBySection } from '../lib/site-context';

export default function Footer() {
  const { settings, content } = useSite();
  const links = contentBySection(content, 'footer_link');
  const columns = links.reduce<Record<string, string[]>>((acc, l) => {
    const col = l.meta?.column || l.title;
    if (!acc[col]) acc[col] = [];
    acc[col].push(l.body || l.title);
    return acc;
  }, {});

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                <Zap className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <p className="font-bold text-slate-900">{settings.site_name}</p>
            </div>
            <p className="mt-3 text-sm text-slate-500">{settings.footer_tagline}</p>
            <div className="mt-4 flex gap-3">
              {settings.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-700"><Twitter className="h-5 w-5" /></a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-700"><Instagram className="h-5 w-5" /></a>
              )}
              {settings.social_github && (
                <a href={settings.social_github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-700"><Github className="h-5 w-5" /></a>
              )}
            </div>
          </div>
          {Object.entries(columns).map(([title, items]) => (
            <FooterCol key={title} title={title} links={items} />
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.site_name}. {settings.footer_copyright}</p>
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
