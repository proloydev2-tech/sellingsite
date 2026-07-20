import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type SupportConfig = {
  ai_enabled: boolean;
  ai_welcome: string;
  telegram_url: string;
  whatsapp_url: string;
};

type Msg = { role: 'bot' | 'user'; text: string };

export default function SupportWidget() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('support_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (!cancelled && data) setConfig(data as SupportConfig);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (open && messages.length === 0 && config?.ai_enabled) {
      setMessages([{ role: 'bot', text: config.ai_welcome }]);
    }
  }, [open, config, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: text, user_email: user?.email || null },
      });
      if (error || !data?.ok) {
        setMessages((m) => [...m, { role: 'bot', text: 'Sorry, I had trouble responding. Please try again or contact us via WhatsApp/Telegram.' }]);
      } else {
        setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Network error. Please try again.' }]);
    }
    setLoading(false);
  };

  const normalizeUrl = (u: string): string => {
    if (!u) return '';
    if (u.startsWith('@')) return `https://t.me/${u.slice(1)}`;
    if (u.startsWith('http')) return u;
    if (u.match(/^\+?\d/)) return `https://wa.me/${u.replace(/[^\d]/g, '')}`;
    return u;
  };

  const telegramUrl = normalizeUrl(config?.telegram_url || '');
  const whatsappUrl = normalizeUrl(config?.whatsapp_url || '');

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 lg:bottom-6"
          aria-label="Open support"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Support</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-sm sm:right-4 sm:left-auto sm:bottom-6 sm:inset-x-auto">
          <div className="flex h-[70vh] max-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">VoltBot Support</p>
                  <p className="text-[11px] text-white/80">{config?.ai_enabled ? 'AI online · typically replies instantly' : 'Online'}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${m.role === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {m.role === 'user' ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick links */}
            {(telegramUrl || whatsappUrl) && (
              <div className="flex gap-2 border-t border-slate-200 bg-white px-3 py-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    WhatsApp
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    Telegram
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* Input */}
            {config?.ai_enabled ? (
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about products, orders, payments..."
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
                AI assistant is off. Use WhatsApp or Telegram above to reach us.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
