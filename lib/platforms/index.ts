import type { PlatformProvider } from './types';
import { NotConfiguredProvider } from './types';
import { ShopeeProvider } from './shopee';
import { TiktokProvider } from './tiktok';

// Registry de plataformas. Para adicionar uma nova (Amazon, AliExpress...):
// 1. crie lib/platforms/<nome>.ts implementando PlatformProvider
// 2. importe e registre abaixo.
// Enquanto as credenciais não forem plugadas no .env.local, os providers
// retornam [] em search() (verificação de "configurado" em cada provider).

const registry: Record<string, PlatformProvider> = {
  shopee: new ShopeeProvider(),
  tiktok: new TiktokProvider(),
};

export function getPlatform(id: string): PlatformProvider {
  return registry[id] ?? new NotConfiguredProvider(id as 'shopee' | 'tiktok', id);
}

export function listPlatforms(): PlatformProvider[] {
  return Object.values(registry);
}

export type { PlatformProvider, PlatformProduct, SearchParams } from './types';
