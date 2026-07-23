'use client';
import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '@/lib/data';
import { RequireAuth } from '@/components/RequireAuth';
import { Card, SectionTitle } from '@/components/ui/primitives';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function ProfileInner() {
  const [shopee, setShopee] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      if (p) { setShopee(p.affiliateIdShopee ?? ''); setTiktok(p.affiliateIdTiktok ?? ''); }
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const { error } = await updateProfile({ affiliateIdShopee: shopee, affiliateIdTiktok: tiktok });
    setSaving(false);
    setMsg(error ? `Erro: ${error}` : '✅ IDs de afiliado salvos! Agora seus links de Shopee/TikTok incluem seu ID.');
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Meu Perfil" subtitle="Cadastre seus IDs de afiliado para gerar links com comissão." />

      <form onSubmit={save}>
        <Card className="space-y-4 p-6">
          <div>
            <Label htmlFor="shopee">ID de afiliado Shopee</Label>
            <Input id="shopee" value={shopee} onChange={(e) => setShopee(e.target.value)} placeholder="ex: AAAAAAABBBBBCCCDDD" />
            <p className="mt-1 text-xs text-ink-400">Encontra em: Shopee Affiliate → Meus Links → seu ID de afiliado.</p>
          </div>
          <div>
            <Label htmlFor="tiktok">ID de afiliado TikTok Shop</Label>
            <Input id="tiktok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="ex: 1234567890" />
            <p className="mt-1 text-xs text-ink-400">Encontra em: TikTok Shop Affiliate → seu código de afiliado.</p>
          </div>
          <Button type="submit" loading={saving} disabled={loading}>Salvar IDs</Button>
          {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        </Card>
      </form>

      <Card className="bg-ink-50 p-5 text-sm text-ink-500">
        <b>Como funciona:</b> ao gerar um link de um produto Shopee/TikTok, o sistema injeta automaticamente seu ID de afiliado
        no deep link (<code>?affiliate_id=SEU_ID</code>). Assim, quando alguém comprar pelo seu link, a comissão vai para você.
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return <RequireAuth><ProfileInner /></RequireAuth>;
}
