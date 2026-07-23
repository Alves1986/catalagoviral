import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';

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
