import { useState } from 'react';
import { Zap, ArrowLeft, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

type Props = { onClose: () => void };

export default function LoginPage({ onClose }: Props) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </button>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30">
                <Zap className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-slate-900">Welcome to VoltStore</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Sign in to track orders, save favorites, and checkout faster.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : <GoogleIcon />}
                Continue with Google
              </button>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">Why sign in?</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  Save favorites and reorder in one tap
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Track your order history securely
                </li>
              </ul>
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              By continuing you agree to our Terms and Privacy Policy.
              <br />
              We only use your name and email from Google.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
