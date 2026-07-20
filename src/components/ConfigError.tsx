import { Zap, AlertTriangle } from 'lucide-react';

export default function ConfigError() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <p className="font-bold text-slate-900">VoltStore</p>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Configuration missing</p>
            <p className="mt-1 text-xs text-amber-800">
              Supabase environment variables are not set. The site cannot load data.
            </p>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-600">
          <p className="font-medium text-slate-900">To fix this on Vercel:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
            <li>Open your Vercel project → Settings → Environment Variables</li>
            <li>Add <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code></li>
            <li>Add <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code></li>
            <li>Redeploy the project</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
