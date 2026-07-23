'use client';
import { useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/primitives';
import { Input, Label } from '@/components/ui/Input';
import { importProducts } from '@/lib/data';
import { isDemoMode } from '@/lib/config';

const SAMPLE = `name,image_url,original_price,promo_price,commission_pct,original_link,source,affiliate_link
"Cafeteira Premium","https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=600&q=80",299.90,149.90,12,https://exemplo.com/cafeteira,shopee,
"Fone Gamer RGB","https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80",199.90,99.90,15,https://exemplo.com/fone,manual,
"Luminária Smart","https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",159.90,79.90,18,https://exemplo.com/luminaria,tiktok,https://tiktok.com/shop/luminaria?affiliate_id=ABC123`;

function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ''));
    const src = (row.source || 'manual').toLowerCase();
    const source: 'shopee' | 'tiktok' | 'manual' = src === 'shopee' || src === 'tiktok' ? src : 'manual';
    return {
      name: row.name,
      imageUrl: row.image_url || null,
      originalPrice: Number(row.original_price),
      promoPrice: Number(row.promo_price),
      commissionPct: Number(row.commission_pct),
      originalLink: row.original_link,
      affiliateLink: row.affiliate_link || null,
      source,
    };
  });
}

function AdminInner() {
  const [text, setText] = useState(SAMPLE);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function importar() {
    setLoading(true);
    setResult(null);
    try {
      const rows = parseCSV(text);
      const { error } = await importProducts(rows);
      setResult(error ? `Erro: ${error}` : `✅ ${rows.length} produtos importados!`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Importar produtos (Admin)" subtitle="Cole um CSV com as colunas: name, image_url, original_price, promo_price, commission_pct, original_link" />
      {isDemoMode() && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Modo Demo: os produtos entram no armazenamento local (localStorage). Em produção, vão para o Supabase da organização selecionada.
        </p>
      )}
      <Card className="p-5 space-y-3">
        <Label htmlFor="csv">CSV</Label>
        <textarea
          id="csv"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-56 w-full rounded-2xl border border-ink-300/50 bg-white p-3 font-mono text-xs text-ink-700 outline-none focus:border-brand-400 focus:ring-brand"
        />
        <Button onClick={importar} loading={loading}>Importar produtos</Button>
        {result && <p className="text-sm text-ink-600">{result}</p>}
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return <RequireAuth><AdminInner /></RequireAuth>;
}
