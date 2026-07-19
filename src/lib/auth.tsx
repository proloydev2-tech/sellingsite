import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, type Profile } from './supabase';

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  adminUser: string | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInAdmin: (username: string, password: string) => Promise<{ error: string | null }>;
  signOutAdmin: () => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const ADMIN_KEY = 'voltstore_admin_user';

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

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
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

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAdmin: !!adminUser,
      adminUser,
      signInWithGoogle: async () => {
        const redirectTo = `${window.location.origin}/`;
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
      },
      signUpWithEmail: async (email, password, fullName, phone) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone } },
        });
        if (error) return { error: error.message };
        if (data.user && !data.session) {
          return { error: 'Check your email to confirm your account.' };
        }
        return { error: null };
      },
      signInWithEmail: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { error: null };
      },
      signInAdmin: async (username, password) => {
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ username: username.trim(), password }),
          });
          const text = await res.text();
          let data: { username?: string; error?: string } = {};
          try { data = JSON.parse(text); } catch { /* non-JSON response */ }
          if (!res.ok || data.error) return { error: data.error || `Login failed (HTTP ${res.status}).` };
          setAdminUser(data.username || null);
          try {
            localStorage.setItem(ADMIN_KEY, data.username || username.trim());
            localStorage.setItem('voltstore_admin_pass', password);
          } catch {
            // ignore
          }
          return { error: null };
        } catch (e) {
          return { error: `Could not reach the login service: ${e instanceof Error ? e.message : String(e)}` };
        }
      },
      signOutAdmin: () => {
        setAdminUser(null);
        try {
          localStorage.removeItem(ADMIN_KEY);
          localStorage.removeItem('voltstore_admin_pass');
        } catch {
          // ignore
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, profile, loading, adminUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
