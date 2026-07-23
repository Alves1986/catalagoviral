'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  fetchInstances, fetchGroups, fetchUserCopies, fetchTopProducts, enqueueDispatch, fetchUserDispatches,
} from '@/lib/data';
import type { WhatsappInstance, WhatsappGroup, CopyGeneration, Product, DispatchItem } from '@/types';
import { RequireAuth } from '@/components/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Card, Badge, EmptyState, SectionTitle } from '@/components/ui/primitives';
import { Select } from '@/components/ui/Input';
import { clsx } from '@/lib/cn';

const statusStyle: Record<DispatchItem['status'], string> = {
  queued: 'bg-amber-100 text-amber-700',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
};

function DispatchInner() {
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [groups, setGroups] = useState<WhatsappGroup[]>([]);
  const [copies, setCopies] = useState<CopyGeneration[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dispatches, setDispatches] = useState<DispatchItem[] | null>(null);

  const [selCopy, setSelCopy] = useState('');
  const [selGroup, setSelGroup] = useState('');
  const [loading, setLoading] = useState(false);

  async function reloadAll() {
    const inst = await fetchInstances();
    setInstances(inst);
    let g: WhatsappGroup[] = [];
    for (const i of inst) if (i.status === 'connected') g = g.concat(await fetchGroups(i.id));
    setGroups(g);
    setCopies(await fetchUserCopies());
    setProducts(await fetchTopProducts({ limit: 100, sortBy: 'sales' }));
    setDispatches(await fetchUserDispatches());
  }

  useEffect(() => { reloadAll(); }, []);

  async function enqueue() {
    if (!selCopy || !selGroup) return;
    setLoading(true);
    const cg = copies.find((c) => c.id === selCopy);
    const text = cg ? (JSON.parse(cg.copyText)[0] ?? cg.videoScript) : '';
    await enqueueDispatch({ copyText: text, groupIds: [selGroup] });
    setLoading(false);
    await reloadAll();
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Disparar" subtitle="Monte a fila: escolha uma copy e um grupo alvo." />

      <Card className="p-5 space-y-3">
        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-1.5">Copy gerada</label>
          <Select value={selCopy} onChange={(e) => setSelCopy(e.target.value)}>
            <option value="">Selecione…</option>
            {copies.map((c) => (
              <option key={c.id} value={c.id}>
                {products.find((p) => p.id === c.productId)?.name ?? 'Copy'} — {new Date(c.createdAt).toLocaleDateString('pt-BR')}
              </option>
            ))}
          </Select>
          {copies.length === 0 && <p className="mt-1 text-xs text-amber-600">Gere uma copy no catálogo primeiro.</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-1.5">Grupo</label>
          <Select value={selGroup} onChange={(e) => setSelGroup(e.target.value)}>
            <option value="">Selecione…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.groupName}</option>
            ))}
          </Select>
          {instances.length === 0 && <p className="mt-1 text-xs text-amber-600">Conecte um número no WhatsApp primeiro.</p>}
        </div>

        <Button onClick={enqueue} loading={loading} disabled={!selCopy || !selGroup}>
          Adicionar à fila
        </Button>
      </Card>

      <div>
        <SectionTitle title="Fila de disparo" />
        {!dispatches ? (
          <div className="h-24 animate-pulse rounded-3xl bg-ink-900/5" />
        ) : dispatches.length === 0 ? (
          <EmptyState title="Fila vazia" description="Adicione um item acima para disparar nos grupos." />
        ) : (
          <div className="space-y-2">
            {dispatches.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-700">{d.copyText}</p>
                    <p className="text-xs text-ink-400">{d.groupIds.length} grupo(s) · {new Date(d.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <Badge className={statusStyle[d.status]}>{d.status}</Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DispatchPage() {
  return <RequireAuth><DispatchInner /></RequireAuth>;
}
