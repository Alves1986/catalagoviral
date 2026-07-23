# Catálogo Viral

Webapp para afiliados de e-commerce (Shopee / TikTok) — catálogo de produtos de alta
comissão, geração de links rastreáveis, copy com IA e disparo em grupos de WhatsApp.

## Como rodar (modo demo sem backend)

```bash
npm install
npm run dev
# abra http://localhost:3000 e clique em "Entrar (demo)"
```

No modo demo (sem credenciais), o app usa `localStorage` e Copy IA mock — **tudo funciona
no navegador**, sem precisar de contas externas.

## Modo produção (Supabase + OpenAI reais)

Crie um arquivo `.env.local` (ou defina na Vercel) com:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...        # server-only, nunca exponha no cliente
OPENAI_API_KEY=sk-...                  # server-only
```

Ao definir as chaves do Supabase, o app automaticamente troca do modo demo para o modo
real (RLS multi-tenant por `organization_id`). Rode o SQL em
`supabase/migrations/0001_init.sql` no SQL Editor do Supabase.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS 4 + Framer Motion
- Supabase (Postgres + Auth + RLS)
- OpenAI `gpt-4o-mini` (via route handler)
- Evolution API (WhatsApp) — Docker Compose separado

## Estrutura

```
app/                 rotas (catálogo, login, whatsapp, dispatch, dashboard, admin)
lib/data.ts         CAMADA DE DADOS ÚNICA (mock ⇄ supabase)
lib/config.ts       detecção de modo demo
lib/mock/store.ts   estado local demo (seed de produtos)
components/         UI (AppShell, ProductCard, CopyModal, RequireAuth)
supabase/migrations/ schema + RLS
```
