// Configuração: o app roda com Supabase (modo real). Se o Supabase não estiver
// configurado, cai em modo mock (localStorage) apenas como fallback de desenvolvimento.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Evolution API (server-only). Lidas de .env.local (não versionado).
export const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? '';
export const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? '';

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0 &&
  !SUPABASE_URL.includes('SEU_PROJETO') && !SUPABASE_ANON_KEY.includes('SUA_CHAVE');

// Modo mock = Supabase ausente. Não há mais "modo demo" forçado por flag.
export function isMockMode(): boolean {
  return !isSupabaseConfigured;
}

// Mantém o export antigo (booleano em build time) apenas para quem importa isMock,
// mas o preferido é isMockMode() (função).
export const isMock = isMockMode();

// Alias amigável usado na UI.
export function isDemoMode(): boolean {
  return isMockMode();
}

export const APP_NAME = 'Catálogo Viral';
