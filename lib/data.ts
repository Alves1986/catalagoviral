import { isMockMode } from './config';
import { supabase, requireSupabase } from './supabaseClient';
import {
  loadStore, saveStore, mockHelpers,
} from './mock/store';
import type {
  Product, GeneratedLink, CopyGeneration, WhatsappInstance, WhatsappGroup, DispatchItem, AppUser, ProductSource,
} from '@/types';

// ===========================================================================
// CAMADA DE DADOS ÚNICA
// Decisão central: se isMock === true, usa localStorage (demo). Senão, usa Supabase.
// Todos os componentes chamam estas funções — nunca chamam Supabase direto.
// ===========================================================================

function g() { return requireSupabase(); }

// ---------- AUTH ----------
export async function signInWithMagicLink(email: string): Promise<{ error?: string }> {
  if (isMockMode()) {
    const s = loadStore();
    s.user = { id: 'demo-user', email, organizationId: mockHelpers.DEMO_ORG, isSuperAdmin: false };
    saveStore(s);
    return {};
  }
  const { error } = await g().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined },
  });
  return { error: error?.message };
}

export async function signOut(): Promise<void> {
  if (isMockMode()) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('catalogo_viral_demo_active');
    }
    const s = loadStore();
    s.user = null;
    saveStore(s);
    invalidateUserCache();
    return;
  }
  await g().auth.signOut();
  invalidateUserCache();
}

// Entra em modo demo forçado: salva um user no localStorage para teste rápido,
// mesmo quando o Supabase está configurado. Seta a flag que força isMockMode().
export async function signInDemo(email: string): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('catalogo_viral_demo_active', '1');
  }
  const s = loadStore();
  s.user = { id: 'demo-user', email, organizationId: mockHelpers.DEMO_ORG, isSuperAdmin: false };
  saveStore(s);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isMockMode()) return loadStore().user;
  return getCachedUser();
}

// Cache simples em memória (TTL 30s) para evitar N queries por tela.
// getCurrentUser é chamado em quase toda função de dados.
let _userCache: { value: AppUser | null; at: number } | null = null;
const USER_TTL = 30_000;

async function getCachedUser(): Promise<AppUser | null> {
  const now = Date.now();
  if (_userCache && now - _userCache.at < USER_TTL) return _userCache.value;
  const { data: { user } } = await g().auth.getUser();
  let appUser: AppUser | null = null;
  if (user) {
    const { data: profile } = await g()
      .from('profiles').select('organization_id, affiliate_id_shopee, affiliate_id_tiktok').eq('id', user.id).single();
    appUser = {
      id: user.id,
      email: user.email ?? '',
      organizationId: profile?.organization_id ?? '',
      isSuperAdmin: profile?.organization_id === null,
    };
  }
  _userCache = { value: appUser, at: now };
  return appUser;
}

// Invalida o cache (usar após signOut / mudança de perfil).
export function invalidateUserCache() { _userCache = null; }

// ---------- PROFILE ----------
export async function getProfile(): Promise<{
  organizationId: string; affiliateIdShopee?: string | null; affiliateIdTiktok?: string | null;
} | null> {
  const u = await getCurrentUser();
  if (!u) return null;
  const { data } = await g().from('profiles').select('organization_id, affiliate_id_shopee, affiliate_id_tiktok').eq('id', u.id).single();
  if (!data) return null;
  return {
    organizationId: data.organization_id,
    affiliateIdShopee: data.affiliate_id_shopee ?? null,
    affiliateIdTiktok: data.affiliate_id_tiktok ?? null,
  };
}

export async function updateProfile(input: { affiliateIdShopee?: string; affiliateIdTiktok?: string }): Promise<{ error?: string }> {
  const u = await getCurrentUser();
  if (!u) return { error: 'não autenticado' };
  const { error } = await g().from('profiles').update({
    affiliate_id_shopee: input.affiliateIdShopee ?? null,
    affiliate_id_tiktok: input.affiliateIdTiktok ?? null,
  }).eq('id', u.id);
  invalidateUserCache();
  return { error: error?.message };
}

// ---------- PRODUCTS ----------
export type ProductFilter = {
  search?: string;
  source?: ProductSource | 'all';
  sortBy?: 'commission' | 'sales' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
};

export async function fetchTopProducts(opts: ProductFilter & { limit?: number } = {}): Promise<Product[]> {
  const {
    search = '', source = 'all', sortBy = 'commission',
    page = 1, pageSize = 24, limit,
  } = opts;

  if (isMockMode()) {
    const s = loadStore();
    let items = s.products.filter((p) => p.active && p.organizationId === s.user?.organizationId);
    // atalho demo (org marcador) usa seed local
    if (s.user?.organizationId === mockHelpers.DEMO_ORG) items = s.products.filter((p) => p.active && p.organizationId === mockHelpers.DEMO_ORG);
    if (search) items = items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (source !== 'all') items = items.filter((p) => p.source === source);
    items.sort((a, b) => sortBy === 'commission' ? b.commissionPct - a.commissionPct
      : sortBy === 'price_asc' ? a.promoPrice - b.promoPrice
      : sortBy === 'price_desc' ? b.promoPrice - a.promoPrice
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const n = limit ?? pageSize;
    return items.slice((page - 1) * n, page * n);
  }

  const orgId = (await getCurrentUser())?.organizationId
    ?? (typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('catalogo_viral_store_v1') || '{}')?.user?.organizationId : null);
  if (!orgId) return [];
  if (orgId === mockHelpers.DEMO_ORG) {
    const s = loadStore();
    let items = s.products.filter((p) => p.active && p.organizationId === mockHelpers.DEMO_ORG);
    if (search) items = items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (source !== 'all') items = items.filter((p) => p.source === source);
    items.sort((a, b) => sortBy === 'commission' ? b.commissionPct - a.commissionPct
      : sortBy === 'price_asc' ? a.promoPrice - b.promoPrice
      : sortBy === 'price_desc' ? b.promoPrice - a.promoPrice
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const n = limit ?? pageSize;
    return items.slice((page - 1) * n, page * n);
  }

  let q = g().from('products').select('*').eq('organization_id', orgId).eq('active', true);
  if (search) q = q.ilike('name', `%${search}%`);
  if (source !== 'all') q = q.eq('source', source);
  q = sortBy === 'commission' ? q.order('commission_pct', { ascending: false })
    : sortBy === 'price_asc' ? q.order('promo_price', { ascending: true })
    : sortBy === 'price_desc' ? q.order('promo_price', { ascending: false })
    : q.order('created_at', { ascending: false });
  const n = limit ?? pageSize;
  q = q.range((page - 1) * n, page * n - 1);
  const { data } = await q;
  return (data ?? []).map(rowToProduct);
}

export async function countProducts(f: ProductFilter = {}): Promise<number> {
  const { search = '', source = 'all' } = f;
  if (isMockMode()) {
    const s = loadStore();
    let items = s.products.filter((p) => p.active && p.organizationId === s.user?.organizationId);
    if (source !== 'all') items = items.filter((p) => p.source === source);
    if (search) items = items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return items.length;
  }
  const orgId = (await getCurrentUser())?.organizationId;
  if (!orgId) return 0;
  let q = g().from('products').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('active', true);
  if (search) q = q.ilike('name', `%${search}%`);
  if (source !== 'all') q = q.eq('source', source);
  const { count } = await q;
  return count ?? 0;
}

// Gera o link de afiliado real a partir do original + ID do afiliado da plataforma.
// Shopee: injeta ?utm_source=...&affiliate_id=<id>; TikTok: ?affiliate_id=<id>
export function buildAffiliateLink(originalLink: string, source: ProductSource, affiliateId?: string | null): string {
  if (!affiliateId) return originalLink;
  const sep = originalLink.includes('?') ? '&' : '?';
  if (source === 'shopee') return `${originalLink}${sep}utm_source=share&affiliate_id=${encodeURIComponent(affiliateId)}`;
  if (source === 'tiktok') return `${originalLink}${sep}affiliate_id=${encodeURIComponent(affiliateId)}`;
  return originalLink;
}

export async function importProducts(rows: Omit<Product, 'id' | 'createdAt' | 'active' | 'organizationId'>[]): Promise<{ error?: string }> {
  if (isMockMode()) {
    const s = loadStore();
    const orgId = s.user?.organizationId ?? mockHelpers.DEMO_ORG;
    const newOnes: Product[] = rows.map((r) => ({
      ...r, id: mockHelpers.uid('p'), organizationId: orgId, active: true, createdAt: new Date().toISOString(),
    }));
    s.products.push(...newOnes);
    saveStore(s);
    return {};
  }
  const orgId = (await getCurrentUser())?.organizationId;
  const { error } = await requireSupabase().from('products').insert(
    rows.map((r) => ({ ...r, organization_id: orgId, active: true })),
  );
  return { error: error?.message };
}

// ---------- LINKS ----------
export async function generateAffiliateLink(
  productId: string,
  opts: { utmSource?: string; channel?: 'whatsapp' | 'instagram' | 'generic' } = {},
): Promise<string> {
  if (isMockMode()) {
    const s = loadStore();
    const id = mockHelpers.uid('l');
    s.links.push({
      id, organizationId: s.user?.organizationId ?? '', userId: s.user?.id ?? '', productId,
      shortPath: `/r/${id}`, clicks: 0, createdAt: new Date().toISOString(),
    });
    saveStore(s);
    return `/r/${id}`;
  }
  const u = await getCurrentUser();
  const { data, error } = await g().from('generated_links')
    .insert({ organization_id: u?.organizationId, user_id: u?.id, product_id: productId })
    .select('id').single();
  if (error || !data) throw new Error(error?.message ?? 'falha ao gerar link');
  return `/r/${data.id}`;
}

export async function fetchUserLinks(): Promise<GeneratedLink[]> {
  if (isMockMode()) {
    const s = loadStore();
    return s.links.filter((l) => l.userId === s.user?.id);
  }
  const u = await getCurrentUser();
  const { data } = await g().from('generated_links').select('*').eq('user_id', u?.id).order('created_at', { ascending: false });
  return (data ?? []).map(rowToLink);
}

export async function resolveRedirect(linkId: string): Promise<string | null> {
  if (isMockMode()) {
    const s = loadStore();
    const link = s.links.find((l) => l.id === linkId || l.shortPath === `/r/${linkId}`);
    if (!link) return null;
    link.clicks += 1;
    saveStore(s);
    const p = s.products.find((x) => x.id === link.productId);
    return p?.originalLink ?? null;
  }
  // 1) valida existência e pega o link original ANTES de contar
  const { data, error } = await g().from('generated_links')
    .select('id, product_id, products(original_link)').eq('id', linkId).single();
  if (error || !data) return null; // link inexistente -> 404, sem incrementar lixo
  const originalLink = (data.products as { original_link?: string } | undefined)?.original_link ?? null;
  if (!originalLink) return null;
  // 2) só agora incrementa (RPC atômica)
  await g().rpc('increment_link_clicks', { link_id: linkId });
  return originalLink;
}

// ---------- COPY ----------
export async function saveCopyGeneration(input: {
  productId: string; copies: string[]; videoScript: string;
}): Promise<CopyGeneration> {
  if (isMockMode()) {
    const s = loadStore();
    const cg: CopyGeneration = {
      id: mockHelpers.uid('c'), organizationId: s.user?.organizationId ?? '', productId: input.productId,
      userId: s.user?.id ?? '', copyText: JSON.stringify(input.copies), videoScript: input.videoScript,
      createdAt: new Date().toISOString(),
    };
    s.copies.push(cg);
    saveStore(s);
    return cg;
  }
  const u = await getCurrentUser();
  const { data, error } = await g().from('copy_generations').insert({
    organization_id: u?.organizationId, user_id: u?.id, product_id: input.productId,
    copy_text: JSON.stringify(input.copies), video_script: input.videoScript,
  }).select('*').single();
  if (error || !data) throw new Error(error?.message ?? 'falha ao salvar copy');
  return rowToCopy(data);
}

export async function fetchUserCopies(): Promise<CopyGeneration[]> {
  if (isMockMode()) {
    const s = loadStore();
    return s.copies.filter((c) => c.userId === s.user?.id);
  }
  const u = await getCurrentUser();
  const { data } = await g().from('copy_generations').select('*').eq('user_id', u?.id);
  return (data ?? []).map(rowToCopy);
}

// ---------- WHATSAPP ----------
export async function createInstance(name: string): Promise<WhatsappInstance> {
  if (isMockMode()) {
    const s = loadStore();
    const inst: WhatsappInstance = {
      id: mockHelpers.uid('i'), organizationId: s.user?.organizationId ?? '', userId: s.user?.id ?? '',
      evolutionInstanceName: name, status: 'pending_qr', createdAt: new Date().toISOString(),
    };
    s.instances.push(inst);
    // simula QR disponível
    saveStore(s);
    return inst;
  }
  const u = await getCurrentUser();
  const { data, error } = await g().from('whatsapp_instances').insert({
    organization_id: u?.organizationId, user_id: u?.id, evolution_instance_name: name, status: 'pending_qr',
  }).select('*').single();
  if (error || !data) throw new Error(error?.message ?? 'falha ao criar instância');
  return rowToInstance(data);
}

export async function setInstanceStatus(id: string, status: WhatsappInstance['status']): Promise<void> {
  if (isMockMode()) {
    const s = loadStore();
    const inst = s.instances.find((i) => i.id === id);
    if (inst) inst.status = status;
    if (status === 'connected') {
      // popula grupos de demo
      s.groups.push(
        { id: mockHelpers.uid('g'), instanceId: id, groupJid: 'g1@demo', groupName: 'Promoções Top 🔥', isActive: true },
        { id: mockHelpers.uid('g'), instanceId: id, groupJid: 'g2@demo', groupName: 'Ofertas do Dia', isActive: true },
      );
    }
    saveStore(s);
    return;
  }
  await g().from('whatsapp_instances').update({ status }).eq('id', id);
}

export async function fetchInstances(): Promise<WhatsappInstance[]> {
  if (isMockMode()) return loadStore().instances.filter((i) => i.userId === loadStore().user?.id);
  const u = await getCurrentUser();
  const { data } = await g().from('whatsapp_instances').select('*').eq('user_id', u?.id);
  return (data ?? []).map(rowToInstance);
}

export async function fetchGroups(instanceId: string): Promise<WhatsappGroup[]> {
  if (isMockMode()) return loadStore().groups.filter((g) => g.instanceId === instanceId && g.isActive);
  const { data } = await g().from('whatsapp_groups').select('*').eq('instance_id', instanceId).eq('is_active', true);
  return (data ?? []).map(rowToGroup);
}

export async function enqueueDispatch(input: { copyText: string; groupIds: string[] }): Promise<DispatchItem> {
  if (isMockMode()) {
    const s = loadStore();
    const item: DispatchItem = {
      id: mockHelpers.uid('d'), organizationId: s.user?.organizationId ?? '', userId: s.user?.id ?? '',
      copyText: input.copyText, groupIds: input.groupIds, status: 'queued', createdAt: new Date().toISOString(),
    };
    s.dispatches.push(item);
    saveStore(s);
    return item;
  }
  const u = await getCurrentUser();
  const { data, error } = await g().from('dispatch_queue').insert({
    organization_id: u?.organizationId, user_id: u?.id,
    copy_text: input.copyText, group_ids: input.groupIds, status: 'queued',
  }).select('*').single();
  if (error || !data) throw new Error(error?.message ?? 'falha ao enfileirar');
  return rowToDispatch(data);
}

export async function fetchUserDispatches(): Promise<DispatchItem[]> {
  if (isMockMode()) return loadStore().dispatches.filter((d) => d.userId === loadStore().user?.id);
  const u = await getCurrentUser();
  const { data } = await g().from('dispatch_queue').select('*').eq('user_id', u?.id).order('created_at', { ascending: false });
  return (data ?? []).map(rowToDispatch);
}

export function isDemoMode(): boolean { return isMockMode(); }

// ---------- ROW MAPPERS ----------
function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string, organizationId: r.organization_id as string, name: r.name as string,
    imageUrl: (r.image_url as string) ?? null, originalPrice: Number(r.original_price),
    promoPrice: Number(r.promo_price), commissionPct: Number(r.commission_pct),
    originalLink: r.original_link as string, affiliateLink: (r.affiliate_link as string) ?? null,
    source: r.source as Product['source'], active: Boolean(r.active),
    createdAt: r.created_at as string,
  };
}
function rowToLink(r: Record<string, unknown>): GeneratedLink {
  return {
    id: r.id as string, organizationId: r.organization_id as string, userId: r.user_id as string,
    productId: r.product_id as string, shortPath: `/r/${r.id as string}`, clicks: Number(r.clicks),
    createdAt: r.created_at as string,
  };
}
function rowToCopy(r: Record<string, unknown>): CopyGeneration {
  return {
    id: r.id as string, organizationId: r.organization_id as string, productId: r.product_id as string,
    userId: r.user_id as string, copyText: (r.copy_text as string) ?? '[]', videoScript: (r.video_script as string) ?? '',
    createdAt: r.created_at as string,
  };
}
function rowToInstance(r: Record<string, unknown>): WhatsappInstance {
  return {
    id: r.id as string, organizationId: r.organization_id as string, userId: r.user_id as string,
    evolutionInstanceName: r.evolution_instance_name as string, status: r.status as WhatsappInstance['status'],
    createdAt: r.created_at as string,
  };
}
function rowToGroup(r: Record<string, unknown>): WhatsappGroup {
  return {
    id: r.id as string, instanceId: r.instance_id as string, groupJid: r.group_jid as string,
    groupName: (r.group_name as string) ?? '', isActive: Boolean(r.is_active),
  };
}
function rowToDispatch(r: Record<string, unknown>): DispatchItem {
  return {
    id: r.id as string, organizationId: r.organization_id as string, userId: r.user_id as string,
    copyText: (r.copy_text as string) ?? '', groupIds: (r.group_ids as string[]) ?? [], status: r.status as DispatchItem['status'],
    createdAt: r.created_at as string,
  };
}
