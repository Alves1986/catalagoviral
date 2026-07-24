'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RequireAuth } from '@/components/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle, Badge } from '@/components/ui/primitives';
import { getSubscription, isSubscriptionActive, type Subscription } from '@/lib/data';
import { CheckIcon } from '@/components/icons';

const ANNUAL_PRICE = process.env.NEXT_PUBLIC_MP_ANNUAL_PRICE ?? '197,00';

function PlanosInner() {
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await getSubscription();
      setSub(s);
    })();
  }, []);

  async function assinar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Falha ao iniciar checkout');
      if (json.initPoint) window.location.href = json.initPoint;
      else throw new Error('init_point ausente');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <SectionTitle title="Planos" subtitle="Assinatura anual única. Sem mensalidade." />

      {isSubscriptionActive(sub) ? (
        <Card className="border-emerald-200 bg-emerald-50/50 p-5">
          <Badge className="bg-emerald-100 text-emerald-700">Assinatura ativa</Badge>
          <p className="mt-2 text-sm text-ink-600">
            Seu acesso vai até <b>{sub?.endsAt ? new Date(sub.endsAt).toLocaleDateString('pt-BR') : '—'}</b>.
          </p>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-br from-brand-600 to-accent-500 p-6 text-white">
              <p className="text-sm/relaxed opacity-90">Catálogo Viral</p>
              <p className="font-display text-4xl font-black">R$ {ANNUAL_PRICE}</p>
              <p className="text-sm opacity-90">por 12 meses de acesso completo</p>
            </div>
            <div className="space-y-2 p-6">
              {[
                'Catálogo de produtos Shopee, TikTok e manual',
                'Geração de copy com IA + roteiro de vídeo',
                'Links de afiliado com seu ID injetado',
                'Disparo nos grupos do WhatsApp (Evolution)',
                'Filtros, busca e ranking de mais quentes',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-ink-700">
                  <CheckIcon className="h-4 w-4 text-emerald-500" /> {f}
                </div>
              ))}
              <Button className="mt-4" fullWidth loading={loading} onClick={assinar}>
                Assinar anual e pagar
              </Button>
              {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
              <p className="mt-2 text-xs text-ink-400">
                Pagamento via Mercado Pago (Pix ou cartão). Após a confirmação, o acesso é liberado automaticamente.
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default function PlanosPage() {
  return <RequireAuth><PlanosInner /></RequireAuth>;
}
