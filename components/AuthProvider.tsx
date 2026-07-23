'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, signOut } from '@/lib/data';
import type { AppUser } from '@/types';

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {}, logout: async () => {} });

export function useAuth() { return useContext(Ctx); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setUser(await getCurrentUser());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // Reage a mudanças de sessão (login/logout/expiração).
    let sub: { unsubscribe: () => void } | null = null;
    import('@/lib/supabaseClient').then(({ supabase }) => {
      if (!supabase) return;
      const { data } = supabase.auth.onAuthStateChange(() => { refresh(); });
      sub = data.subscription;
    });
    return () => { sub?.unsubscribe(); };
  }, []);

  async function logout() {
    await signOut();
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, refresh, logout }}>{children}</Ctx.Provider>;
}
