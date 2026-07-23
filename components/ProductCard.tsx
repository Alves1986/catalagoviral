'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge, Card } from '@/components/ui/primitives';
import { formatBRL, commissionValue, clsx } from '@/lib/cn';
import { generateAffiliateLink } from '@/lib/data';
import { CopyModal } from './CopyModal';

const sourceLabel: Record<Product['source'], { label: string; cls: string }> = {
  shopee: { label: 'Shopee', cls: 'bg-orange-100 text-orange-700' },
  tiktok: { label: 'TikTok', cls: 'bg-pink-100 text-pink-700' },
  manual: { label: 'Manual', cls: 'bg-ink-100 text-ink-600' },
};

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const [copied, setCopied] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  const ganho = commissionValue(product.promoPrice, product.commissionPct);
  const src = sourceLabel[product.source];

  async function divulgar() {
    setLinkLoading(true);
    try {
      const path = await generateAffiliateLink(product.id);
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard pode falhar em contexto sem permissão; o link já foi gerado
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      >
        <Card className="group flex h-full flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1">
          <div className="relative aspect-[4/3] overflow-hidden bg-ink-50">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full place-items-center text-ink-300">sem imagem</div>
            )}
            <div className="absolute left-3 top-3">
              <Badge className={src.cls}>{src.label}</Badge>
            </div>
            <div className="absolute right-3 top-3 rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold text-white shadow-soft">
              {product.commissionPct}% COM
            </div>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <h3 className="line-clamp-2 font-semibold text-ink-900 min-h-[2.5rem]">{product.name}</h3>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm text-ink-400 line-through">{formatBRL(product.originalPrice)}</span>
              <span className="font-display text-xl font-extrabold text-brand-700">{formatBRL(product.promoPrice)}</span>
            </div>

            <div className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-sm">
              <span className="text-ink-500">Você ganha até </span>
              <b className="text-brand-700">{formatBRL(ganho)}</b>
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="primary" onClick={divulgar} loading={linkLoading} className="flex-1">
                {copied ? '✓ Link copiado!' : 'Divulgar'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowCopy(true)} className="flex-1">
                Gerar copy
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {showCopy && <CopyModal product={product} onClose={() => setShowCopy(false)} />}
    </>
  );
}
