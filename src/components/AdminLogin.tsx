import { useState } from 'react';
import { Zap, Lock, User as UserIcon, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';

type Props = { onClose: () => void };

export default function AdminLogin({ onClose }: Props) {
  const { signInAdmin } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signInAdmin(form.username, form.password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </button>

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30">
                <ShieldCheck className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h1 className="mt-5 text-2xl font-bold">Admin access</h1>
              <p className="mt-1.5 text-sm text-slate-300">
                Sign in to manage products, orders, and reviews.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Username</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/30">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  <input
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="praloy"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Password</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/30">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in to admin panel
              </button>
            </form>

            <p className="mt-5 text-center text-[11px] text-slate-400">
              <Zap className="mr-1 inline h-3 w-3" />
              Restricted area — authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
