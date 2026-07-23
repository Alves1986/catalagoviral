'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithMagicLink, signInDemo, isDemoMode } from '@/lib/data';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/primitives';
import { isDemoMode as demo } from '@/lib/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) { setError(error); return; }
    setSent(true);
  }

  // Entra direto com um usuário demo (localStorage), útil para testar o app
  // rapidamente mesmo quando o Supabase está configurado.
  async function handleDemo() {
    await signInDemo('demo@catalogoviral.app');
    window.location.assign('/');
  }

  return (
    <div className="grid min-h-[80vh] place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Catálogo Viral" className="mx-auto mb-3 h-14 w-14 rounded-2xl shadow-soft" />
          <h1 className="font-display text-3xl font-extrabold text-ink-900">Entrar no Catálogo Viral</h1>
          <p className="mt-1 text-ink-400">Afiliados que convertem, de forma simples.</p>
        </div>

        <Card className="p-6">
          {sent ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-600">✓</div>
              <p className="font-semibold text-ink-800">Link enviado!</p>
              <p className="mt-1 text-sm text-ink-400">Abra o e-mail <b>{email}</b> para acessar.</p>
              <button onClick={handleDemo} className="mt-4 text-sm font-semibold text-brand-600 hover:underline">
                ou entre em modo demo
              </button>
            </div>
          ) : (
            <form onSubmit={handle} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Seu e-mail</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              </div>
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Enviar link mágico
              </Button>
              <button
                type="button"
                onClick={handleDemo}
                className="w-full text-center text-sm font-semibold text-brand-600 hover:underline"
              >
                Entrar em modo demo (sem e-mail)
              </button>
              {demo() && (
                <p className="text-center text-xs text-amber-600">
                  Modo Demo detectado: variáveis do Supabase ausentes. O app usa dados locais.
                </p>
              )}
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
