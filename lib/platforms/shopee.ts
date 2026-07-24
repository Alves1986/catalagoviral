import type { PlatformProvider, PlatformProduct, SearchParams } from './types';

// Shopee Affiliate API (open.shopee.com).
// Credenciais necessárias (plugar em .env.local quando aprovado):
//   SHOPEE_PARTNER_ID, SHOPEE_PARTNER_SECRET, SHOPEE_SHOP_ID (via OAuth)
// A busca AO VIVO fica pendente da aprovação do app parceiro. Aqui mapeamos a
// resposta e geramos o link de afiliado. Mantido pronto para plugar.

const PARTNER_ID = process.env.SHOPEE_PARTNER_ID ?? '';
const PARTNER_SECRET = process.env.SHOPEE_PARTNER_SECRET ?? '';

function configured() {
  return PARTNER_ID.length > 0 && PARTNER_SECRET.length > 0;
}

export class ShopeeProvider implements PlatformProvider {
  id = 'shopee' as const;
  label = 'Shopee';

  async search(_params: SearchParams): Promise<PlatformProduct[]> {
    if (!configured()) return [];
    // TODO: chamar a Shopee Open API (v2 item/search) com assinatura HMAC.
    // Mapear a resposta para PlatformProduct.
    return [];
  }

  buildAffiliateLink(originalLink: string, affiliateId: string | null): string {
    if (!affiliateId) return originalLink;
    // Shopee: injeta utm_source=affiliates e affiliate_id.
    const sep = originalLink.includes('?') ? '&' : '?';
    return `${originalLink}${sep}utm_source=affiliates&utm_medium=affiliate&affiliate_id=${encodeURIComponent(affiliateId)}`;
  }
}
