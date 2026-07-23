// Configuração híbrida: detecta se o Supabase está configurado.
// Se NÃO estiver, todo o app roda em modo DEMO (mock) e já funciona no navegador.
// Se ESTIVER configurado, ainda assim o usuário pode entrar em "modo demo" (login demo),
// que força o uso de dados locais mesmo com backend presente.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0 &&
  !SUPABASE_URL.includes('SEU_PROJETO') && !SUPABASE_ANON_KEY.includes('SUA_CHAVE');

const DEMO_FLAG_KEY = 'catalogo_viral_demo_active';

// Lê a flag de modo demo (setada pelo signInDemo). Em SSR retorna false.
function demoFlagActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DEMO_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

// Modo mock = Supabase ausente OU usuário entrou em modo demo explícito.
export function isMockMode(): boolean {
  return !isSupabaseConfigured || demoFlagActive();
}

// Mantém o export antigo (booleano em build time) apenas para quem importa isMock,
// mas o preferido é isMockMode() (função, respeita a flag de demo em runtime).
export const isMock = isMockMode();

// Alias amigável usado na UI.
export function isDemoMode(): boolean {
  return isMockMode();
}

export const APP_NAME = 'Catálogo Viral';
