// Adapter server-only para a Evolution API (instalada no Render).
// NUNCA importar este módulo em componente 'use client' — a API key é secreta.
import { EVOLUTION_API_URL, EVOLUTION_API_KEY } from './config';

export interface EvolutionInstance {
  name: string;
  connectionStatus: string;
  ownerJid?: string | null;
  profileName?: string | null;
}

export interface EvolutionGroup {
  id: string; // groupJid (ex: 123456789@g.us)
  subject: string; // nome do grupo
  size?: number;
  owner?: string | null;
}

function headers(): Record<string, string> {
  return { apikey: (process.env.EVOLUTION_API_KEY ?? ''), 'Content-Type': 'application/json' };
}

export function evolutionConfigured(): boolean {
  return EVOLUTION_API_URL.length > 0 && EVOLUTION_API_KEY.length > 0;
}

// Lista todas as instâncias da Evolution (compartilhadas com outros sistemas).
export async function listInstances(): Promise<EvolutionInstance[]> {
  if (!evolutionConfigured()) return [];
  const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, { headers: headers(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Evolution listInstances: ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((r: Record<string, unknown>) => ({
    name: String(r.name ?? ''),
    connectionStatus: String(r.connectionStatus ?? 'unknown'),
    ownerJid: (r.ownerJid as string) ?? null,
    profileName: (r.profileName as string) ?? null,
  }));
}

// Busca os grupos de uma instância (precisa estar conectada).
export async function fetchGroups(instanceName: string): Promise<EvolutionGroup[]> {
  if (!evolutionConfigured()) return [];
  const url = `${EVOLUTION_API_URL}/group/fetchAllGroups/${encodeURIComponent(instanceName)}`;
  const res = await fetch(url, { headers: headers(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Evolution fetchGroups: ${res.status}`);
  const data = await res.json();
  // A resposta costuma vir em data[].id / data[].subject (campos do WhatsApp).
  const arr = Array.isArray(data) ? data : (data?.groups ?? []);
  return arr.map((g: Record<string, unknown>) => ({
    id: String(g.id ?? ''),
    subject: String(g.subject ?? g.name ?? '(sem nome)'),
    size: typeof g.size === 'number' ? g.size : undefined,
    owner: (g.owner as string) ?? null,
  }));
}

// Envia texto para um grupo (groupJid).
export async function sendText(instanceName: string, groupJid: string, text: string): Promise<{ success: boolean; error?: string }> {
  if (!evolutionConfigured()) return { success: false, error: 'Evolution não configurada' };
  const url = `${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(instanceName)}`;
  const body = { number: groupJid, text, linkPreview: false };
  const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    return { success: false, error: `HTTP ${res.status}: ${t.slice(0, 200)}` };
  }
  return { success: true };
}
