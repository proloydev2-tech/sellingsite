import { useState } from 'react';
import {
  Zap,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  LayoutDashboard,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

type Props = { onClose: () => void; defaultTab?: 'signin' | 'signup' };

type Mode = 'signin' | 'signup' | 'admin' | 'forgot';

export default function LoginPage({ onClose, defaultTab = 'signin' }: Props) {
  const {
    signInWithGoogle,
    signInWithEmail,
    sendVerificationCode,
    verifyCode,
    signUpWithCode,
    resetPasswordWithCode,
    signInAdmin,
  } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultTab);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // sign in
  const [signin, setSignin] = useState({ email: '', password: '' });
  // sign up
  const [signup, setSignup] = useState({ name: '', email: '', phone: '', password: '' });
  // admin
  const [admin, setAdmin] = useState({ username: '', password: '' });
  // signup verification
  const [signupCode, setSignupCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  // forgot password
  const [forgot, setForgot] = useState({ email: '', code: '', password: '' });
  const [forgotStage, setForgotStage] = useState<'email' | 'reset'>('email');

  const startResendTimer = () => {
    setResendIn(60);
    const t = setInterval(() => {
      setResendIn((n) => {
        if (n <= 1) {
          clearInterval(t);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signInWithEmail(signin.email, signin.password);
    if (error) setError(error);
    else onClose();
    setLoading(false);
  };

  const handleSendSignupCode = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await sendVerificationCode(signup.email, 'signup');
    if (error) setError(error);
    else {
      setCodeSent(true);
      setInfo('A 6-digit code was sent to your email. Enter it below to finish signing up.');
      startResendTimer();
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    if (!signupCode.trim()) {
      setError('Please enter the 6-digit code sent to your email.');
      setLoading(false);
      return;
    }
    const { error } = await signUpWithCode(
      signup.email,
      signup.password,
      signup.name,
      signup.phone,
      signupCode.trim(),
    );
    if (error) setError(error);
    else {
      setError(null);
      setInfo('Account created. You can now sign in.');
      setMode('signin');
      setSignin({ email: signup.email, password: '' });
      setCodeSent(false);
      setSignupCode('');
    }
    setLoading(false);
  };

  const handleAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signInAdmin(admin.username, admin.password);
    if (error) setError(error);
    else {
      window.location.hash = '/admin';
      onClose();
    }
    setLoading(false);
  };

  // Forgot password handlers
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await sendVerificationCode(forgot.email, 'reset');
    if (error) setError(error);
    else {
      setInfo('A reset code was sent to your email. Enter it below with your new password.');
      setForgotStage('reset');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await resetPasswordWithCode(forgot.email, forgot.password, forgot.code.trim());
    if (error) setError(error);
    else {
      setInfo('Password reset. You can now sign in.');
      setMode('signin');
      setSignin({ email: forgot.email, password: '' });
      setForgot({ email: '', code: '', password: '' });
      setForgotStage('email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </button>

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30">
                <Zap className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-slate-900">
                {mode === 'signup' ? 'Create your account'
                  : mode === 'admin' ? 'Admin login'
                  : mode === 'forgot' ? 'Reset password'
                  : 'Welcome back'}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {mode === 'signup'
                  ? 'Sign up to track orders, save favorites, and checkout faster.'
                  : mode === 'admin'
                    ? 'Sign in to the admin panel.'
                    : mode === 'forgot'
                      ? 'Enter your email to receive a reset code.'
                      : 'Sign in to continue to VoltStore.'}
              </p>
            </div>

            {mode !== 'admin' && mode !== 'forgot' && (
              <>
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
                  <span className="text-xs text-slate-400">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              </>
            )}

            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3">
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <input
                    type="email"
                    required
                    value={signin.email}
                    onChange={(e) => setSignin({ ...signin, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </Field>
                <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={signin.password}
                    onChange={(e) => setSignin({ ...signin, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </Field>

                {error && <ErrorBox text={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </button>

                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-500">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setMode('signup'); setError(null); setInfo(null); }} className="font-semibold text-emerald-600 hover:text-emerald-700">
                      Sign up
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setInfo(null); }}
                    className="font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Forgot?
                  </button>
                </div>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <Field label="Full name" icon={<UserIcon className="h-4 w-4" />}>
                  <input
                    required
                    value={signup.name}
                    onChange={(e) => setSignup({ ...signup, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </Field>
                <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                  <input
                    type="email"
                    required
                    value={signup.email}
                    onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </Field>
                <Field label="Phone number" icon={<Phone className="h-4 w-4" />}>
                  <input
                    type="tel"
                    required
                    value={signup.phone}
                    onChange={(e) => setSignup({ ...signup, phone: e.target.value })}
                    placeholder="+1 555 000 0000"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </Field>
                <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signup.password}
                    onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </Field>

                {codeSent && (
                  <Field label="Email verification code" icon={<KeyRound className="h-4 w-4" />}>
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={signupCode}
                      onChange={(e) => setSignupCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      className="w-full bg-transparent text-sm tracking-widest outline-none placeholder:text-slate-400"
                    />
                  </Field>
                )}

                {error && <ErrorBox text={error} />}
                {info && <InfoBox text={info} />}

                {!codeSent ? (
                  <button
                    type="button"
                    onClick={handleSendSignupCode}
                    disabled={loading || !signup.email || !signup.password || !signup.name || !signup.phone}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send verification code
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify & create account
                  </button>
                )}

                {codeSent && (
                  <button
                    type="button"
                    onClick={handleSendSignupCode}
                    disabled={resendIn > 0}
                    className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
                  >
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                  </button>
                )}

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setMode('signin'); setError(null); setInfo(null); }} className="font-semibold text-emerald-600 hover:text-emerald-700">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {mode === 'forgot' && (
              forgotStage === 'email' ? (
                <form onSubmit={handleSendResetCode} className="space-y-3">
                  <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                    <input
                      type="email"
                      required
                      value={forgot.email}
                      onChange={(e) => setForgot({ ...forgot, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </Field>
                  {error && <ErrorBox text={error} />}
                  {info && <InfoBox text={info} />}
                  <button
                    type="submit"
                    disabled={loading || !forgot.email}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send reset code
                  </button>
                  <p className="text-center text-sm text-slate-500">
                    Remembered it?{' '}
                    <button type="button" onClick={() => { setMode('signin'); setError(null); setInfo(null); }} className="font-semibold text-emerald-600 hover:text-emerald-700">
                      Back to sign in
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <Field label="Reset code" icon={<KeyRound className="h-4 w-4" />}>
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={forgot.code}
                      onChange={(e) => setForgot({ ...forgot, code: e.target.value.replace(/\D/g, '') })}
                      placeholder="6-digit code"
                      className="w-full bg-transparent text-sm tracking-widest outline-none placeholder:text-slate-400"
                    />
                  </Field>
                  <Field label="New password" icon={<Lock className="h-4 w-4" />}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={forgot.password}
                      onChange={(e) => setForgot({ ...forgot, password: e.target.value })}
                      placeholder="At least 6 characters"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </Field>
                  {error && <ErrorBox text={error} />}
                  {info && <InfoBox text={info} />}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Reset password
                  </button>
                </form>
              )
            )}

            {mode === 'admin' && (
              <form onSubmit={handleAdmin} className="space-y-3">
                <Field label="Admin username" icon={<UserIcon className="h-4 w-4" />}>
                  <input
                    required
                    value={admin.username}
                    onChange={(e) => setAdmin({ ...admin, username: e.target.value })}
                    placeholder="praloy"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </Field>
                <Field label="Admin password" icon={<Lock className="h-4 w-4" />}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={admin.password}
                    onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </Field>

                {error && <ErrorBox text={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enter admin panel
                </button>
              </form>
            )}

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => { setMode(mode === 'admin' ? 'signin' : 'admin'); setError(null); setInfo(null); }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {mode === 'admin' ? 'Back to customer sign in' : 'Admin login'}
              </button>
            </div>

            {mode !== 'admin' && mode !== 'forgot' && (
              <div className="mt-5 rounded-xl bg-slate-50 p-3">
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    Save favorites and reorder in one tap
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Track your order history securely
                  </li>
                </ul>
              </div>
            )}

            <p className="mt-4 text-center text-[11px] text-slate-400">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
        <span className="text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
      {text}
    </div>
  );
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
      {text}
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
