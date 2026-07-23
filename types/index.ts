export type ProductSource = 'shopee' | 'tiktok' | 'manual';
export type ProductCategory =
  | 'eletronicos' | 'moda' | 'casa' | 'beleza' | 'pets'
  | 'esportes' | 'infantil' | 'livros' | 'automotivo' | 'geral';

export const CATEGORIAS: { value: ProductCategory; label: string }[] = [
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'moda', label: 'Moda' },
  { value: 'casa', label: 'Casa' },
  { value: 'beleza', label: 'Beleza' },
  { value: 'pets', label: 'Pets' },
  { value: 'esportes', label: 'Esportes' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'livros', label: 'Livros' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'geral', label: 'Geral' },
];

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  imageUrl: string | null;
  originalPrice: number;
  promoPrice: number;
  commissionPct: number;
  originalLink: string;
  affiliateLink: string | null; // link de afiliado real (Shopee/TikTok/Manual)
  source: ProductSource;
  category: ProductCategory;
  hot: boolean;
  salesRank: number;
  active: boolean;
  createdAt: string;
}

export interface GeneratedLink {
  id: string;
  organizationId: string;
  userId: string;
  productId: string;
  shortPath: string; // ex: /r/<id>
  affiliateLink: string | null; // deep link de afiliado real (quando aplicável)
  clicks: number;
  createdAt: string;
}

export interface CopyGeneration {
  id: string;
  organizationId: string;
  productId: string;
  userId: string;
  copyText: string; // JSON string de string[]
  videoScript: string;
  createdAt: string;
}

export type InstanceStatus = 'pending_qr' | 'connected' | 'disconnected';
export type DispatchStatus = 'queued' | 'sending' | 'sent' | 'failed';

export interface WhatsappInstance {
  id: string;
  organizationId: string;
  userId: string;
  evolutionInstanceName: string;
  status: InstanceStatus;
  createdAt: string;
}

export interface WhatsappGroup {
  id: string;
  instanceId: string;
  groupJid: string;
  groupName: string;
  isActive: boolean;
}

export interface DispatchItem {
  id: string;
  organizationId: string;
  userId: string;
  copyText: string;
  groupIds: string[]; // whatsapp_groups.id
  status: DispatchStatus;
  createdAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
  affiliateIdShopee?: string | null;
  affiliateIdTiktok?: string | null;
  fullName?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  pixKey?: string | null;
  instagram?: string | null;
}

export interface RawProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  originalPrice: number;
  promoPrice: number;
  commissionPct: number;
  originalLink: string;
  source: ProductSource;
}
