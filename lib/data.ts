import { isMock } from './config';
import { supabase, requireSupabase } from './supabaseClient';
import {
  loadStore, saveStore, mockHelpers,
} from './mock/store';
import type {
  Product, GeneratedLink, CopyGeneration, WhatsappInstance, WhatsappGroup, DispatchItem, AppUser,
} from '@/types';

// ===========================================================================
// CAMADA DE DADOS ÚNICA
// Decisão central: se isMock === true, usa localStorage (demo). Senão, usa Supabase.
// Todos os componentes chamam estas funções — nunca chamam Supabase direto.
// ===========================================================================

function g() { return requireSupabase(); }

// ---------- AUTH ----------
export async function signInWithMagicLink(email: string): Promise<{ error?: string }> {
  if (isMock) {
    const s = loadStore();
    s.user = { id: 'demo-user', email, organizationId: mockHelpers.DEMO_ORG, isSuperAdmin: false };
    saveStore(s);
    return {};
  }
  const { error } = await g().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined },
  });
  return { error: error?.message };
}

export async function signOut(): Promise<void> {
  if (isMock) {
    const s = loadStore();
    s.user = null;
    saveStore(s);
    return;
  }
  await g().auth.signOut();
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isMock) return loadStore().user;
  const { data: { user } } = await g().auth.getUser();
  if (!user) return null;
  const { data: profile } = await g()
    .from('profiles').select('organization_id, affiliate_id_shopee, affiliate_id_tiktok').eq('id', user.id).single();
  return {
    id: user.id,
    email: user.email ?? '',
    organizationId: profile?.organization_id ?? '',
    isSuperAdmin: profile?.organization_id === null,
  };
}

// ---------- PRODUCTS ----------
export async function fetchTopProducts(opts: { limit: number; sortBy: 'commission' | 'sales' }): Promise<Product[]> {
  if (isMock) {
    const s = loadStore();
    const items = s.products.filter((p) => p.active && p.organizationId === s.user?.organizationId);
    items.sort((a, b) => opts.sortBy === 'commission'
      ? b.commissionPct - a.commissionPct
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items.slice(0, opts.limit);
  }
  const orgId = (await getCurrentUser())?.organizationId;
  if (!orgId) return [];
  let q = g().from('products').select('*').eq('organization_id', orgId).eq('active', true).limit(opts.limit);
  q = opts.sortBy === 'commission' ? q.order('commission_pct', { ascending: false }) : q.order('created_at', { ascending: false });
  const { data } = await q;
  return (data ?? []).map(rowToProduct);
}

export async function importProducts(rows: Omit<Product, 'id' | 'createdAt' | 'active' | 'organizationId'>[]): Promise<{ error?: string }> {
  if (isMock) {
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
export async function generateAffiliateLink(productId: string): Promise<string> {
  if (isMock) {
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
  if (isMock) {
    const s = loadStore();
    return s.links.filter((l) => l.userId === s.user?.id);
  }
  const u = await getCurrentUser();
  const { data } = await g().from('generated_links').select('*').eq('user_id', u?.id).order('created_at', { ascending: false });
  return (data ?? []).map(rowToLink);
}

export async function resolveRedirect(linkId: string): Promise<string | null> {
  if (isMock) {
    const s = loadStore();
    const link = s.links.find((l) => l.id === linkId || l.shortPath === `/r/${linkId}`);
    if (!link) return null;
    link.clicks += 1;
    saveStore(s);
    const p = s.products.find((x) => x.id === link.productId);
    return p?.originalLink ?? null;
  }
  // incremento atômico via RPC
  await g().rpc('increment_link_clicks', { link_id: linkId });
  const { data } = await g().from('generated_links')
    .select('product_id, products(original_link)').eq('id', linkId).single();
  return (data?.products as { original_link?: string } | undefined)?.original_link ?? null;
}

// ---------- COPY ----------
export async function saveCopyGeneration(input: {
  productId: string; copies: string[]; videoScript: string;
}): Promise<CopyGeneration> {
  if (isMock) {
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
  if (isMock) {
    const s = loadStore();
    return s.copies.filter((c) => c.userId === s.user?.id);
  }
  const u = await getCurrentUser();
  const { data } = await g().from('copy_generations').select('*').eq('user_id', u?.id);
  return (data ?? []).map(rowToCopy);
}

// ---------- WHATSAPP ----------
export async function createInstance(name: string): Promise<WhatsappInstance> {
  if (isMock) {
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
  if (isMock) {
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
  if (isMock) return loadStore().instances.filter((i) => i.userId === loadStore().user?.id);
  const u = await getCurrentUser();
  const { data } = await g().from('whatsapp_instances').select('*').eq('user_id', u?.id);
  return (data ?? []).map(rowToInstance);
}

export async function fetchGroups(instanceId: string): Promise<WhatsappGroup[]> {
  if (isMock) return loadStore().groups.filter((g) => g.instanceId === instanceId && g.isActive);
  const { data } = await g().from('whatsapp_groups').select('*').eq('instance_id', instanceId).eq('is_active', true);
  return (data ?? []).map(rowToGroup);
}

export async function enqueueDispatch(input: { copyText: string; groupIds: string[] }): Promise<DispatchItem> {
  if (isMock) {
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
  if (isMock) return loadStore().dispatches.filter((d) => d.userId === loadStore().user?.id);
  const u = await getCurrentUser();
  const { data } = await g().from('dispatch_queue').select('*').eq('user_id', u?.id).order('created_at', { ascending: false });
  return (data ?? []).map(rowToDispatch);
}

export function isDemoMode(): boolean { return isMock; }

// ---------- ROW MAPPERS ----------
function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string, organizationId: r.organization_id as string, name: r.name as string,
    imageUrl: (r.image_url as string) ?? null, originalPrice: Number(r.original_price),
    promoPrice: Number(r.promo_price), commissionPct: Number(r.commission_pct),
    originalLink: r.original_link as string, source: r.source as Product['source'], active: Boolean(r.active),
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
