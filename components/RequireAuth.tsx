'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { getSubscription, isSubscriptionActive, type Subscription } from '@/lib/data';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/primitives';

// Protege uma rota no client: se não há usuário, redireciona ao login.
// Se o usuário está logado MAS a assinatura não está ativa, mostra tela de renovação.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return; }
    if (user) {
      (async () => {
        const s = await getSubscription();
        setSub(s);
        setChecking(false);
      })();
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  // assinatura ativa -> conteúdo
  if (!checking && isSubscriptionActive(sub)) return <>{children}</>;

  // ainda checando a assinatura
  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  // sem assinatura ativa -> tela de renovação
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="p-6 text-center">
        <SectionTitle title="Assinatura necessária" subtitle="Seu acesso à plataforma de gestão de links expirou ou ainda não foi ativado." />
        <p className="mb-4 text-sm text-ink-500">
          O Catálogo Viral é um SaaS de assinatura anual. Assine para liberar o catálogo, a geração de links de afiliado e o disparo nos grupos.
        </p>
        <Button onClick={() => router.push('/planos')}>Ver planos e assinar</Button>
      </Card>
    </div>
  );
}
