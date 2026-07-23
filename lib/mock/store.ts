import type {
  Product, GeneratedLink, CopyGeneration, WhatsappInstance, WhatsappGroup, DispatchItem, AppUser,
} from '@/types';

const KEY = 'catalogo_viral_store_v1';

export interface MockStore {
  user: AppUser | null;
  products: Product[];
  links: GeneratedLink[];
  copies: CopyGeneration[];
  instances: WhatsappInstance[];
  groups: WhatsappGroup[];
  dispatches: DispatchItem[];
}

export const DEMO_ORG = 'org-demo-00000000-0000-0000-0000-000000000001';

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function seed(): MockStore {
  const products: Product[] = [
    {
      id: 'p1', organizationId: DEMO_ORG, name: 'Fone Bluetooth Earbuds Pro 5',
      imageUrl: 'https://images.unsplash.com/photo-1606220838315-28d5ad5a82a5?w=600&q=80',
      originalPrice: 199.9, promoPrice: 89.9, commissionPct: 12, source: 'shopee', active: true,
      affiliateLink: null,
      originalLink: 'https://shopee.com.br/produto-fone', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'p2', organizationId: DEMO_ORG, name: 'Smartwatch GPS Amoled 1.9"',
      imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80',
      originalPrice: 349.0, promoPrice: 179.9, commissionPct: 15, source: 'tiktok', active: true,
      affiliateLink: null,
      originalLink: 'https://tiktok.com/shop/smartwatch', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'p3', organizationId: DEMO_ORG, name: 'Kit Organizador de Cabos Magnético',
      imageUrl: 'https://images.unsplash.com/photo-1591290619767-3d6c6d43d3c9?w=600&q=80',
      originalPrice: 49.9, promoPrice: 24.9, commissionPct: 20, source: 'manual', active: true,
      affiliateLink: null,
      originalLink: 'https://exemplo.com/organizador', createdAt: new Date().toISOString(),
    },
    {
      id: 'p4', organizationId: DEMO_ORG, name: 'Luminária LED RGB com Controle App',
      imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80',
      originalPrice: 129.9, promoPrice: 59.9, commissionPct: 18, source: 'shopee', active: true,
      affiliateLink: null,
      originalLink: 'https://shopee.com.br/produto-luminaria', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'p5', organizationId: DEMO_ORG, name: 'Cafeteira Elétrica Inox 1.5L',
      imageUrl: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=600&q=80',
      originalPrice: 259.9, promoPrice: 139.9, commissionPct: 10, source: 'tiktok', active: true,
      affiliateLink: null,
      originalLink: 'https://tiktok.com/shop/cafeteira', createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'p6', organizationId: DEMO_ORG, name: 'Mochila Antifurto USB Carregável',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
      originalPrice: 199.0, promoPrice: 99.9, commissionPct: 14, source: 'manual', active: true,
      affiliateLink: null,
      originalLink: 'https://exemplo.com/mochila', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  return {
    user: { id: 'demo-user', email: 'demo@catalogoviral.app', organizationId: DEMO_ORG, isSuperAdmin: false, affiliateIdShopee: null, affiliateIdTiktok: null },
    products,
    links: [
      { id: 'l1', organizationId: DEMO_ORG, userId: 'demo-user', productId: 'p2', shortPath: '/r/l1', affiliateLink: null, clicks: 42, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'l2', organizationId: DEMO_ORG, userId: 'demo-user', productId: 'p4', shortPath: '/r/l2', affiliateLink: null, clicks: 17, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    ],
    copies: [],
    instances: [],
    groups: [],
    dispatches: [
      { id: 'd1', organizationId: DEMO_ORG, userId: 'demo-user', copyText: '🔥 Smartwatch GPS em oferta!', groupIds: ['g1'], status: 'sent', createdAt: new Date(Date.now() - 3600000).toISOString() },
    ],
  };
}

export function loadStore(): MockStore {
  if (typeof window === 'undefined') return seed();
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    const s = seed();
    window.localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  try {
    return JSON.parse(raw) as MockStore;
  } catch {
    const s = seed();
    window.localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
}

export function saveStore(store: MockStore): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

export function resetStore(): MockStore {
  const s = seed();
  saveStore(s);
  return s;
}

export const mockHelpers = { uid, DEMO_ORG };
