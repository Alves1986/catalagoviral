'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, signOut, isDemoMode } from '@/lib/data';
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
      // Em modo real, tenta a sessão do Supabase. Se não houver sessão,
      // aceita um user "demo" salvo no localStorage (atalho de teste rápido).
      let u = await getCurrentUser();
      if (!u && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('catalogo_viral_store_v1');
        if (raw) {
          try { u = JSON.parse(raw).user ?? null; } catch { u = null; }
        }
      }
      setUser(u);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function logout() {
    await signOut();
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, refresh, logout }}>{children}</Ctx.Provider>;
}
