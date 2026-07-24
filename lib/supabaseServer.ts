import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';
import type { NextRequest } from 'next/server';

// Cliente SERVER-ONLY com service role key. Nunca importar em componente client.
// Usado para operações privilegiadas (criar org/profile no signup, queries admin).
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabaseServer: SupabaseClient | null =
  SUPABASE_URL.length > 0 && SERVICE_ROLE_KEY.length > 0
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export function requireSupabaseServer(): SupabaseClient {
  if (!supabaseServer) throw new Error('Supabase server (service role) não configurado.');
  return supabaseServer;
}

// Extrai o usuário autenticado a partir do cookie de sessão do Supabase na requisição.
// O cookie `sb-<ref>-auth-token` guarda um JSON com { access_token, ... }.
export async function getUserFromRequest(req: NextRequest): Promise<{ user: { id: string; email: string } | null; orgId: string | null }> {
  if (!supabaseServer) return { user: null, orgId: null };
  const cookie =
    req.cookies.get('sb-access-token')?.value ??
    Object.keys(req.cookies.getAll())
      .filter((k) => k.endsWith('-auth-token'))
      .map((k) => req.cookies.get(k)?.value)
      .find(Boolean);
  if (!cookie) return { user: null, orgId: null };
  let accessToken: string | undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(cookie));
    accessToken = parsed.access_token || parsed.accessToken;
  } catch {
    accessToken = cookie;
  }
  if (!accessToken) return { user: null, orgId: null };
  const { data } = await supabaseServer.auth.getUser(accessToken);
  if (!data.user) return { user: null, orgId: null };
  const { data: profile } = await supabaseServer
    .from('profiles').select('organization_id').eq('id', data.user.id).maybeSingle();
  return { user: { id: data.user.id, email: data.user.email ?? '' }, orgId: profile?.organization_id ?? null };
}
