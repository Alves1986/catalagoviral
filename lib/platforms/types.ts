// Interface comum de provedor de plataforma de afiliado.
// Novas plataformas (Shopee, TikTok, ...) implementam esta interface e
// se registram em lib/platforms/index.ts. A busca ao vivo depende de credencial
// (partner_id/secret ou app_key/secret) que o usuário pluga depois.

export interface PlatformProduct {
  externalId: string;
  name: string;
  imageUrl: string | null;
  originalPrice: number;
  promoPrice: number;
  commissionPct: number;
  originalLink: string;
  source: 'shopee' | 'tiktok' | 'manual';
  category: string;
  hot: boolean;
  salesRank: number;
}

export interface SearchParams {
  query?: string;
  category?: string;
  limit?: number;
}

export interface PlatformProvider {
  id: 'shopee' | 'tiktok';
  label: string;
  // Busca produtos na API da plataforma. Retorna [] se não configurada.
  search(params: SearchParams): Promise<PlatformProduct[]>;
  // Injeta o ID de afiliado do usuário no link original.
  buildAffiliateLink(originalLink: string, affiliateId: string | null): string;
}

// Não configurado: retorna vazio. A UI mostra "plataforma não conectada".
export class NotConfiguredProvider implements PlatformProvider {
  constructor(public id: 'shopee' | 'tiktok', public label: string) {}
  async search(): Promise<PlatformProduct[]> { return []; }
  buildAffiliateLink(originalLink: string): string { return originalLink; }
}
