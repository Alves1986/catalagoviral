// Configuração híbrida: detecta se o Supabase está configurado.
// Se NÃO estiver, todo o app roda em modo DEMO (mock) e já funciona no navegador.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0 &&
  !SUPABASE_URL.includes('SEU_PROJETO') && !SUPABASE_ANON_KEY.includes('SUA_CHAVE');

// No modo mock, o app inteiro usa dados locais (localStorage) e não precisa de backend.
export const isMock = !isSupabaseConfigured;

// Alias amigável usado na UI (função para permitir isDemoMode()).
export function isDemoMode(): boolean {
  return isMock;
}

export const APP_NAME = 'Catálogo Viral';
