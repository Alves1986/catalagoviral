'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { WhatsappInstance, WhatsappGroup } from '@/types';
import { RequireAuth } from '@/components/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Card, Badge, EmptyState, SectionTitle } from '@/components/ui/primitives';
import { WhatsappIcon } from '@/components/icons';

interface EvolutionInst {
  name: string;
  connectionStatus: string;
  ownerJid?: string | null;
  profileName?: string | null;
}

function WhatsAppInner() {
  const [instances, setInstances] = useState<EvolutionInst[] | null>(null);
  const [groups, setGroups] = useState<Record<string, WhatsappGroup[]>>({});
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setError(null);
    try {
      const res = await fetch('/api/evolution/instances');
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Falha ao carregar instâncias'); setInstances([]); return; }
      const list: EvolutionInst[] = json.instances ?? [];
      setInstances(list);
      const g: Record<string, WhatsappGroup[]> = {};
      for (const inst of list) {
        if (inst.connectionStatus === 'open' || inst.connectionStatus === 'connected') {
          const gr = await fetch(`/api/evolution/groups?instance=${encodeURIComponent(inst.name)}`);
          const gj = await gr.json();
          g[inst.name] = (gj.groups ?? []).map((x: { id: string; subject: string }) => ({
            id: x.id, instanceId: inst.name, groupJid: x.id, groupName: x.subject, isActive: true,
          }));
        }
      }
      setGroups(g);
    } catch (e) {
      setError('Erro de conexão com a Evolution API.');
      setInstances([]);
    }
  }

  useEffect(() => { reload(); }, []);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="WhatsApp"
        subtitle="Números conectados na sua Evolution API (compartilhada com outros sistemas)."
        action={<Badge className="bg-emerald-100 text-emerald-700"><WhatsappIcon className="h-3.5 w-3.5" /> Evolution API</Badge>}
      />

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <Card className="p-5">
        <p className="text-sm font-semibold text-ink-700 mb-2">Como conectar</p>
        <p className="text-xs text-ink-400">
          A instância já existe na sua Evolution (ex: <b>ministral-global-v2</b>). Se ela estiver <b>open</b> (conectada),
          os grupos aparecem abaixo automaticamente. Use um número <b>secundário/comercial</b> — disparar em massa pode banir o número.
        </p>
        <Button className="mt-3" variant="outline" onClick={reload} disabled={instances === null}>Atualizar</Button>
      </Card>

      {!instances ? (
        <div className="h-24 animate-pulse rounded-3xl bg-ink-900/5" />
      ) : instances.length === 0 ? (
        <EmptyState title="Nenhuma instância" description="Crie/conecte uma instância na sua Evolution API." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {instances.map((inst) => (
            <motion.div key={inst.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                      <WhatsappIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink-900">{inst.name}</p>
                      <p className="text-xs text-ink-400">{inst.profileName ?? inst.ownerJid ?? ''}</p>
                    </div>
                  </div>
                  <Badge className={inst.connectionStatus === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                    {inst.connectionStatus}
                  </Badge>
                </div>

                {(inst.connectionStatus === 'open' || inst.connectionStatus === 'connected') && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-ink-500 mb-1">Grupos disponíveis</p>
                    <ul className="space-y-1">
                      {(groups[inst.name] ?? []).map((g) => (
                        <li key={g.id} className="rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-700">{g.groupName}</li>
                      ))}
                      {(groups[inst.name] ?? []).length === 0 && (
                        <li className="rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-400">Nenhum grupo encontrado</li>
                      )}
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
