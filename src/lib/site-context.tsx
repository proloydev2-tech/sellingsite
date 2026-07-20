import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchSiteContent,
  fetchSiteSettings,
  defaultSettings,
  defaultContent,
  type SiteContent,
  type SiteSettings,
} from './site';

type SiteCtx = {
  settings: SiteSettings;
  content: SiteContent[];
  loading: boolean;
  reload: () => Promise<void>;
};

const Ctx = createContext<SiteCtx | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [content, setContent] = useState<SiteContent[]>(defaultContent);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [s, c] = await Promise.all([fetchSiteSettings(), fetchSiteContent()]);
    setSettings(s);
    setContent(c);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const value = useMemo<SiteCtx>(() => ({ settings, content, loading, reload }), [settings, content, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}

export function contentBySection(content: SiteContent[], section: string): SiteContent[] {
  return content.filter((c) => c.section === section).sort((a, b) => a.sort_order - b.sort_order);
}
