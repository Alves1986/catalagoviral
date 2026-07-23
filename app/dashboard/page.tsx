'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchUserLinks, fetchUserDispatches, fetchTopProducts } from '@/lib/data';
import type { GeneratedLink, DispatchItem, Product } from '@/types';
import { RequireAuth } from '@/components/RequireAuth';
import { Card, Badge, EmptyState, SectionTitle } from '@/components/ui/primitives';
import { formatDate, formatBRL, clsx } from '@/lib/cn';

const statusStyle: Record<DispatchItem['status'], string> = {
  queued: 'bg-amber-100 text-amber-700',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
};

function DashboardInner() {
  const [links, setLinks] = useState<GeneratedLink[] | null>(null);
  const [dispatches, setDispatches] = useState<DispatchItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      setLinks(await fetchUserLinks());
      setDispatches(await fetchUserDispatches());
      setProducts(await fetchTopProducts({ limit: 200, sortBy: 'sales' }));
    })();
  }, []);

  const totalClicks = (links ?? []).reduce((s, l) => s + l.clicks, 0);
  const sent = dispatches.filter((d) => d.status === 'sent').length;

  return (
    <div className="space-y-6">
      <SectionTitle title="Meus Links" subtitle="Acompanhe cliques e disparos." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-ink-400">Total de links</p>
          <p className="font-display text-3xl font-extrabold text-ink-900">{links?.length ?? 0}</p>
        </Card>
        <Card className="p-5 bg-brand-gradient text-white">
          <p className="text-sm text-white/80">Cliques registrados</p>
          <p className="font-display text-3xl font-extrabold">{totalClicks}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-400">Disparos enviados</p>
          <p className="font-display text-3xl font-extrabold text-ink-900">{sent}</p>
        </Card>
      </div>

      <div>
        <SectionTitle title="Links gerados" />
        {!links ? (
          <div className="h-24 animate-pulse rounded-3xl bg-ink-900/5" />
        ) : links.length === 0 ? (
          <EmptyState title="Você ainda não gerou links" description="Vá ao catálogo e clique em 'Divulgar' em um produto." />
        ) : (
          <div className="space-y-2">
            {links.map((l, i) => {
              const p = products.find((x) => x.id === l.productId);
              return (
                <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-800">{p?.name ?? 'Produto'}</p>
                      <code className="text-xs text-brand-600">{l.shortPath}</code>
                      <p className="text-xs text-ink-400">criado em {formatDate(l.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-extrabold text-brand-700">{l.clicks}</p>
                      <p className="text-xs text-ink-400">cliques</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <SectionTitle title="Status dos disparos" />
        {dispatches.length === 0 ? (
          <EmptyState title="Nenhum disparo ainda" />
        ) : (
          <div className="space-y-2">
            {dispatches.map((d) => (
              <Card key={d.id} className="flex items-center justify-between gap-3 p-4">
                <p className="truncate text-sm text-ink-700">{d.copyText}</p>
                <Badge className={statusStyle[d.status]}>{d.status}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <RequireAuth><DashboardInner /></RequireAuth>;
}
