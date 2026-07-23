'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, WhatsappGroup, WhatsappInstance } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/primitives';
import { saveCopyGeneration, fetchInstances, fetchGroups, enqueueDispatch } from '@/lib/data';
import { formatBRL, clsx } from '@/lib/cn';

interface CopyResult {
  copies: string[];
  videoScript: string;
}

export function CopyModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCopied, setLastCopied] = useState<number | null>(null);

  // disparo em grupos
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [groups, setGroups] = useState<WhatsappGroup[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const inst = await fetchInstances();
      setInstances(inst);
      let g: WhatsappGroup[] = [];
      for (const i of inst) if (i.status === 'connected') g = g.concat(await fetchGroups(i.id));
      setGroups(g);
    })();
  }, []);

  async function gerar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Falha ao gerar copy');
      }
      const data = (await res.json()) as CopyResult;
      await saveCopyGeneration({ productId: product.id, copies: data.copies, videoScript: data.videoScript });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setLastCopied(idx);
    setTimeout(() => setLastCopied(null), 1500);
  }

  function toggleGroup(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function disparar() {
    if (selected.length === 0 || !result) return;
    setDispatching(true);
    setDispatchMsg(null);
    try {
      const text = result.copies[0] ?? result.videoScript;
      // enfileira um item por grupo selecionado (ou um único com todos os groupIds)
      await enqueueDispatch({ copyText: text, groupIds: selected });
      setDispatchMsg(`✓ Enfileirado para ${selected.length} grupo(s). Acompanhe em "Disparar".`);
      setSelected([]);
    } catch (e) {
      setDispatchMsg(e instanceof Error ? e.message : 'Falha ao enfileirar');
    } finally {
      setDispatching(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="max-h-[85vh] overflow-y-auto p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-ink-900">Gerar copy com IA</h3>
                <p className="text-sm text-ink-400 line-clamp-1">{product.name}</p>
              </div>
              <button onClick={onClose} className="rounded-lg px-2 py-1 text-ink-400 hover:bg-ink-900/5">✕</button>
            </div>

            {!result && !loading && (
              <div className="text-center py-4">
                <p className="text-sm text-ink-500 mb-4">
                  Crie 3 variações de texto para WhatsApp + 1 roteiro de vídeo para {formatBRL(product.promoPrice)}.
                </p>
                <Button onClick={gerar} loading={loading}>Gerar agora</Button>
              </div>
            )}

            {loading && (
              <div className="py-10 text-center text-ink-400">
                <span className="mx-auto mb-3 block h-8 w-8 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin" />
                A IA está criando suas variações…
              </div>
            )}

            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

            {result && (
              <div className="space-y-3">
                {result.copies.map((c, i) => (
                  <div key={i} className="rounded-2xl border border-ink-900/5 bg-ink-50/50 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink-400">Variação {i + 1}</span>
                      <button
                        onClick={() => copyText(c, i)}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        {lastCopied === i ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-ink-700">{c}</p>
                  </div>
                ))}

                <div className="rounded-2xl bg-accent-500/5 border border-accent-500/20 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-accent-600">🎬 Roteiro de vídeo (30s)</span>
                    <button
                      onClick={() => copyText(result.videoScript, 99)}
                      className="text-xs font-semibold text-accent-600 hover:underline"
                    >
                      {lastCopied === 99 ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-ink-700">{result.videoScript}</p>
                </div>

                {/* DISPARO NOS GRUPOS */}
                <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-3">
                  <p className="text-sm font-semibold text-ink-800 mb-1">Disparar nos grupos do WhatsApp</p>
                  {instances.length === 0 ? (
                    <p className="text-xs text-amber-600">Conecte um número em <b>WhatsApp</b> para disparar.</p>
                  ) : groups.length === 0 ? (
                    <p className="text-xs text-amber-600">Nenhum grupo disponível neste número.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1 my-2">
                      {groups.map((g) => {
                        const on = selected.includes(g.id);
                        return (
                          <label
                            key={g.id}
                            className={clsx(
                              'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm',
                              on ? 'bg-brand-100 text-brand-800' : 'bg-white text-ink-700',
                            )}
                          >
                            <input type="checkbox" checked={on} onChange={() => toggleGroup(g.id)} className="accent-brand-600" />
                            {g.groupName}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    variant="primary"
                    fullWidth
                    loading={dispatching}
                    disabled={selected.length === 0}
                    onClick={disparar}
                  >
                    Disparar em {selected.length > 0 ? `${selected.length} grupo(s)` : 'grupos'}
                  </Button>
                  {dispatchMsg && <p className="mt-2 text-xs text-emerald-600">{dispatchMsg}</p>}
                </div>

                <Button variant="secondary" fullWidth onClick={onClose}>Fechar</Button>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

