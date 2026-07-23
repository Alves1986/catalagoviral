'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn } from '@/lib/data';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/primitives';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError(error); return; }
    window.location.assign('/');
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setInfo(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, orgName }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Falha no cadastro'); setLoading(false); return; }
      setInfo('Conta criada! Agora faça login com seu e-mail e senha.');
      setMode('login');
      setPassword('');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally { setLoading(false); }
  }

  return (
    <div className="grid min-h-[80vh] place-items-center px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Catálogo Viral" className="mx-auto mb-3 h-14 w-14 rounded-2xl shadow-soft" />
          <h1 className="font-display text-3xl font-extrabold text-ink-900">
            {mode === 'login' ? 'Entrar no Catálogo Viral' : 'Criar conta'}
          </h1>
          <p className="mt-1 text-ink-400">Afiliados que convertem, de forma simples.</p>
        </div>

        <Card className="p-6">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Seu e-mail</label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Senha</label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="sua senha" />
              </div>
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <Button type="submit" fullWidth size="lg" loading={loading}>Entrar</Button>
              <p className="text-center text-xs text-ink-400">
                Não tem conta?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="font-semibold text-brand-600 hover:underline">
                  Criar conta
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Seu e-mail</label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Senha</label>
                <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">Nome da organização</label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Minha Organização" />
              </div>
              {error && <p className="text-sm text-rose-500">{error}</p>}
              {info && <p className="text-sm text-emerald-600">{info}</p>}
              <Button type="submit" fullWidth size="lg" loading={loading}>Criar conta</Button>
              <p className="text-center text-xs text-ink-400">
                Já tem conta?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(null); }} className="font-semibold text-brand-600 hover:underline">
                  Entrar
                </button>
              </p>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
