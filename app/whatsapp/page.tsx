'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  createInstance, setInstanceStatus, fetchInstances, fetchGroups, isDemoMode,
} from '@/lib/data';
import type { WhatsappInstance, WhatsappGroup } from '@/types';
import { RequireAuth } from '@/components/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Card, Badge, EmptyState, SectionTitle } from '@/components/ui/primitives';
import { Input } from '@/components/ui/Input';
import { WhatsappIcon } from '@/components/icons';

function WhatsAppInner() {
  const [instances, setInstances] = useState<WhatsappInstance[] | null>(null);
  const [name, setName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [groups, setGroups] = useState<Record<string, WhatsappGroup[]>>({});

  async function reload() {
    const list = await fetchInstances();
    setInstances(list);
    const g: Record<string, WhatsappGroup[]> = {};
    for (const inst of list) {
      if (inst.status === 'connected') g[inst.id] = await fetchGroups(inst.id);
    }
    setGroups(g);
  }

  useEffect(() => { reload(); }, []);

  async function connect() {
    if (!name.trim()) return;
    setConnecting(true);
    const inst = await createInstance(name.trim());
    await setInstanceStatus(inst.id, 'connected'); // simula escaneio imediato no demo
    setName('');
    setConnecting(false);
    await reload();
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="WhatsApp"
        subtitle="Conecte um número para divulgar sua copy nos grupos."
        action={<Badge className="bg-emerald-100 text-emerald-700"><WhatsappIcon className="h-3.5 w-3.5" /> Evolution API</Badge>}
      />

      <Card className="p-5">
        <p className="text-sm font-semibold text-ink-700 mb-2">Conectar novo número</p>
        <p className="text-xs text-ink-400 mb-3">
          No modo demo o QR é simulado. Em produção, use um número <b>secundário/comercial</b> — disparar em massa pode banir o número.
        </p>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da instância (ex: MinhaLoja)" />
          <Button onClick={connect} loading={connecting}>Conectar</Button>
        </div>
      </Card>

      {!instances ? (
        <div className="h-24 animate-pulse rounded-3xl bg-ink-900/5" />
      ) : instances.length === 0 ? (
        <EmptyState title="Nenhum número conectado" description="Conecte um número acima para começar." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {instances.map((inst) => (
            <motion.div key={inst.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                      <WhatsappIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink-900">{inst.evolutionInstanceName}</p>
                      <p className="text-xs text-ink-400">{inst.status === 'connected' ? 'Conectado' : 'Desconectado'}</p>
                    </div>
                  </div>
                  <Badge className={inst.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'}>
                    {inst.status}
                  </Badge>
                </div>

                {inst.status === 'connected' && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-ink-500 mb-1">Grupos disponíveis</p>
                    <ul className="space-y-1">
                      {(groups[inst.id] ?? []).map((g) => (
                        <li key={g.id} className="rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-700">{g.groupName}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WhatsAppPage() {
  return <RequireAuth><WhatsAppInner /></RequireAuth>;
}
