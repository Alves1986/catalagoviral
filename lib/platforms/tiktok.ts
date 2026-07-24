import type { PlatformProvider, PlatformProduct, SearchParams } from './types';

// TikTok Shop Affiliate API (partner.tiktokshop.com).
// Credenciais necessárias (plugar em .env.local quando aprovado):
//   TIKTOK_APP_KEY, TIKTOK_APP_SECRET, TIKTOK_ACCESS_TOKEN (via OAuth)
// A busca AO VIVO fica pendente da aprovação do app. Aqui mapeamos e geramos link.

const APP_KEY = process.env.TIKTOK_APP_KEY ?? '';
const APP_SECRET = process.env.TIKTOK_APP_SECRET ?? '';

function configured() {
  return APP_KEY.length > 0 && APP_SECRET.length > 0;
}

export class TiktokProvider implements PlatformProvider {
  id = 'tiktok' as const;
  label = 'TikTok Shop';

  async search(_params: SearchParams): Promise<PlatformProduct[]> {
    if (!configured()) return [];
    // TODO: chamar TikTok Shop Affiliate API (product search) com assinatura HMAC.
    return [];
  }

  buildAffiliateLink(originalLink: string, affiliateId: string | null): string {
    if (!affiliateId) return originalLink;
    const sep = originalLink.includes('?') ? '&' : '?';
    return `${originalLink}${sep}affiliate_id=${encodeURIComponent(affiliateId)}`;
  }
}
