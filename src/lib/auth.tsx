import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from './supabase';

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  adminUser: string | null;
  adminRole: 'owner' | 'admin' | null;
  signInWithGoogle: () => Promise<void>;
  sendVerificationCode: (email: string, purpose: 'signup' | 'login' | 'reset') => Promise<{ error: string | null }>;
  verifyCode: (email: string, code: string, purpose: 'signup' | 'login' | 'reset') => Promise<{ error: string | null }>;
  signUpWithCode: (email: string, password: string, fullName: string, phone: string, code: string) => Promise<{ error: string | null }>;
  resetPasswordWithCode: (email: string, password: string, code: string) => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInAdmin: (username: string, password: string) => Promise<{ error: string | null }>;
  signOutAdmin: () => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const ADMIN_KEY = 'voltstore_admin_user';
const ADMIN_PASS_KEY = 'voltstore_admin_pass';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ADMIN_KEY);
    } catch {
      return null;
    }
  });
  const [adminRole, setAdminRole] = useState<'owner' | 'admin' | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!session?.user) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!cancelled) setProfile(data as Profile | null);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // When adminUser is set, fetch role from admin_users table
  useEffect(() => {
    if (!adminUser) {
      setAdminRole(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('username', adminUser)
        .maybeSingle();
      if (!cancelled) setAdminRole((data?.role as 'owner' | 'admin') || 'admin');
    })();
    return () => {
      cancelled = true;
    };
  }, [adminUser]);

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin: !!adminUser,
      adminUser,
      adminRole,
      signInWithGoogle: async () => {
        const redirectTo = `${window.location.origin}/`;
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
      },
      sendVerificationCode: async (email, purpose) => {
        try {
          const { data, error } = await supabase.functions.invoke('auth-verify', {
            body: { action: 'send_code', email, purpose },
          });
          if (error) return { error: error.message };
          if (!data?.ok) return { error: data?.message || 'Failed to send code' };
          return { error: null };
        } catch (e: any) {
          return { error: e?.message || 'Network error' };
        }
      },
      verifyCode: async (email, code, purpose) => {
        try {
          const { data, error } = await supabase.functions.invoke('auth-verify', {
            body: { action: 'verify_code', email, code, purpose },
          });
          if (error) return { error: error.message };
          if (!data?.ok) return { error: data?.message || 'Invalid code' };
          return { error: null };
        } catch (e: any) {
          return { error: e?.message || 'Network error' };
        }
      },
      signUpWithCode: async (email, password, fullName, phone, code) => {
        try {
          const { data, error } = await supabase.functions.invoke('auth-verify', {
            body: { action: 'signup', email, password, full_name: fullName, phone, code },
          });
          if (error) return { error: error.message };
          if (!data?.ok) return { error: data?.message || 'Signup failed' };
          return { error: null };
        } catch (e: any) {
          return { error: e?.message || 'Network error' };
        }
      },
      resetPasswordWithCode: async (email, password, code) => {
        try {
          const { data, error } = await supabase.functions.invoke('auth-verify', {
            body: { action: 'reset_password', email, password, code },
          });
          if (error) return { error: error.message };
          if (!data?.ok) return { error: data?.message || 'Reset failed' };
          return { error: null };
        } catch (e: any) {
          return { error: e?.message || 'Network error' };
        }
      },
      signInWithEmail: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { error: null };
      },
      signInAdmin: async (username, password) => {
        try {
          const { data, error } = await supabase
            .from('admin_users')
            .select('username, role')
            .eq('username', username.trim())
            .eq('password', password)
            .maybeSingle();
          if (error) return { error: `DB error: ${error.message || 'Login query failed.'}` };
          if (!data) return { error: 'Invalid admin credentials.' };
          setAdminUser(data.username);
          setAdminRole((data.role as 'owner' | 'admin') || 'admin');
          try {
            localStorage.setItem(ADMIN_KEY, data.username);
            localStorage.setItem(ADMIN_PASS_KEY, password);
          } catch {
            // ignore
          }
          return { error: null };
        } catch (e) {
          const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
          return { error: `Login error: ${msg}` };
        }
      },
      signOutAdmin: () => {
        setAdminUser(null);
        setAdminRole(null);
        try {
          localStorage.removeItem(ADMIN_KEY);
          localStorage.removeItem(ADMIN_PASS_KEY);
        } catch {
          // ignore
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, profile, loading, adminUser, adminRole],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getAdminCreds(): { username: string; password: string } | null {
  try {
    const username = localStorage.getItem(ADMIN_KEY);
    const password = localStorage.getItem(ADMIN_PASS_KEY);
    if (username && password) return { username, password };
  } catch {
    // ignore
  }
  return null;
}
