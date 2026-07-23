'use client';
import { useEffect, useState } from 'react';
import { getProfile, updateProfile, type ProfileData } from '@/lib/data';
import { RequireAuth } from '@/components/RequireAuth';
import { Card, SectionTitle } from '@/components/ui/primitives';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const EMPTY: ProfileData = {
  fullName: '', whatsapp: '', city: '', state: '', pixKey: '', instagram: '',
  affiliateIdShopee: '', affiliateIdTiktok: '',
};

function ProfileInner() {
  const [form, setForm] = useState<ProfileData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      if (p) setForm({ ...EMPTY, ...p });
      setLoading(false);
    })();
  }, []);

  function set<K extends keyof ProfileData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const { error } = await updateProfile({
      fullName: form.fullName || null,
      whatsapp: form.whatsapp || null,
      city: form.city || null,
      state: form.state || null,
      pixKey: form.pixKey || null,
      instagram: form.instagram || null,
      affiliateIdShopee: form.affiliateIdShopee || null,
      affiliateIdTiktok: form.affiliateIdTiktok || null,
    });
    setSaving(false);
    setMsg(error ? `Erro: ${error}` : '✅ Perfil salvo com sucesso!');
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Meu Perfil" subtitle="Seus dados de cadastro e IDs de afiliado para comissão." />

      <form onSubmit={save} className="space-y-6">
        <Card className="space-y-4 p-6">
          <h3 className="font-semibold text-ink-800">Dados de cadastro</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" value={form.fullName ?? ''} onChange={(e) => set('fullName', e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="(43) 99999-9999" />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} placeholder="Telêmaco Borba" />
            </div>
            <div>
              <Label htmlFor="state">Estado (UF)</Label>
              <Input id="state" value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} placeholder="PR" maxLength={2} />
            </div>
            <div>
              <Label htmlFor="pixKey">Chave Pix</Label>
              <Input id="pixKey" value={form.pixKey ?? ''} onChange={(e) => set('pixKey', e.target.value)} placeholder="CPF / e-mail / telefone" />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={form.instagram ?? ''} onChange={(e) => set('instagram', e.target.value)} placeholder="@seu.perfil" />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h3 className="font-semibold text-ink-800">IDs de afiliado (comissão)</h3>
          <div>
            <Label htmlFor="shopee">ID de afiliado Shopee</Label>
            <Input id="shopee" value={form.affiliateIdShopee ?? ''} onChange={(e) => set('affiliateIdShopee', e.target.value)} placeholder="ex: AAAAAAABBBBBCCCDDD" />
            <p className="mt-1 text-xs text-ink-400">Shopee Affiliate → Meus Links → seu ID de afiliado.</p>
          </div>
          <div>
            <Label htmlFor="tiktok">ID de afiliado TikTok Shop</Label>
            <Input id="tiktok" value={form.affiliateIdTiktok ?? ''} onChange={(e) => set('affiliateIdTiktok', e.target.value)} placeholder="ex: 1234567890" />
            <p className="mt-1 text-xs text-ink-400">TikTok Shop Affiliate → seu código de afiliado.</p>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} disabled={loading}>Salvar perfil</Button>
          {msg && <p className="text-sm text-emerald-600">{msg}</p>}
        </div>
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
