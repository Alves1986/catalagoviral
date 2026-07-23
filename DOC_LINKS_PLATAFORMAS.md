# Como o Catálogo Viral pega os links das plataformas (Shopee / TikTok) e os usa no site

Este documento explica, de ponta a ponta, como os links de afiliado entram no Catálogo
Viral e como eles são rastreados, e quais **chaves/credenciais** são necessárias para
deixar tudo 100% automatizado (sem copiar/colar manual).

---

## 1. Onde o link mora no banco

Cada produto tem dois campos importantes:

| Campo           | Exemplo                              | Papel                                                            |
|-----------------|--------------------------------------|------------------------------------------------------------------|
| `original_link` | `https://shopee.com.br/produto-abc`  | Link "cru" do produto (usado no modo manual/CSV).                |
| `affiliate_link`| `https://shopee.com.br/produto-abc?af...` | Link COM sua tag de afiliado (é o que vai para o `/r/[id]` e gera comissão. |

No modo real (Supabase), a coluna é `products.original_link` (e você pode adicionar
`affiliate_link`). No modo demo, o seed já popula `original_link`.

## 2. Como o link vira "viral" (rastreável)

O fluxo de rastreamento funciona assim:

1. Você clica em **Divulgar** num produto → o app gera um `GeneratedLink` com `short_path`
   (ex: `/r/l1abc`) e salva no banco.
2. Você copia `https://seudominio.com/r/l1abc` e manda no WhatsApp / grupos.
3. Quando alguém clica, a rota `GET /r/[id]`:
   - faz **redirect 302** para o `original_link` (ou `affiliate_link`);
   - chama a função RPC `increment_link_clicks(id)` **atomicamente** (evita perder cliques
     em acessos simultâneos — não é ler-e-somar, é UPDATE direto no banco).
4. O dashboard "Meus Links" mostra `clicks` por link.

> O `/r/[id]` é o "link curto de rastreamento". Ele NUNCA expõe sua tag de afiliado na
> URL que você distribui — só no momento do redirect. Isso protege contra roubo de tag.

## 3. Modo manual (funciona hoje, zero config)

No admin (`/admin/import`) você cola um CSV com a coluna `original_link` já contendo seu
link de afiliado (ex: link gerado no painel da Shopee/TikTok Afiliados). É o caminho mais
simples e não exige nenhuma API key.

```
name,image_url,original_price,promo_price,commission_pct,original_link
"Cafeteira","https://...jpg",299.90,149.90,20,https://shopee.com.br/produto-X?af=SUA_TAG
```

## 4. Automação total — o que cada plataforma exige

Para NÃO ter que copiar link manualmente, o sistema precisa **gerar o link de afiliado
programaticamente**. Cada plataforma tem seu mecanismo:

### 4.1 Shopee Affiliate (recomendado: rede de afiliados)
A Shopee não tem uma API pública aberta de "gerar link de afiliado" para qualquer dev.
O caminho oficial é pela **rede de afiliados** (ex: Shopee Affiliate Program / parcerias
tipo `afiliados.shopee.com.br` ou redes como `Lomadee`, `Awin`, `Tradedoubler`).

- **O que você precisa:** conta aprovada na rede de afiliados da Shopee.
- **A "key" que vai no Catálogo Viral:** o **`affiliate_id`** (ex: `affiliate_id_shopee`)
  da sua conta. Guardado no `profiles.affiliate_id_shopee`.
- **Como vira link:** a rede fornece um formato de deep link, ex:
  `https://shopee.com.br/product-i.{shopid}.{itemid}?af_id={SEU_AF_ID}`.
  O app monta esse link automaticamente a partir do `product_id` da Shopee + seu `affiliate_id`.
- **Alternativa sem rede:** gerar o link manualmente 1x no painel da Shopee e colar no CSV
  (modo manual acima). A automação só vale a pena com volume alto.

### 4.2 TikTok Shop Affiliate
O TikTok Shop tem API oficial de afiliados (`TikTok Shop Open API` / `Seller/Affiliate Center`):

- **O que você precisa:** app credenciado na TikTok for Developers (`client_key` + `client_secret`)
  com escopo de Affiliate, e sua conta de afiliado aprovada.
- **As keys que vão no `.env`** (server-only):
  ```
  TIKTOK_CLIENT_KEY=***
  TIKTOK_CLIENT_SECRET=***
  TIKTOK_ACCESS_TOKEN=***   # obtido via OAuth (expira ~24h; precisa de refresh)
  ```
- **Como vira link:** a API `affiliate/.../generate_link` (ou endpoint de `promotion link`)
  retorna o link de afiliado assinado a partir do `product_id` do TikTok.
- **Status no Catálogo Viral:** preparado no tipo `ProductSource = 'tiktok'`, mas o adapter
  real (chamada à API) é **débito técnico** — não implementado ainda (ver seção 6).

### 4.3 NVIDIA (geração de copy com IA)
Já configurada. A chave (`NVIDIA_API_KEY`) está no `.env.local` e a rota
`/api/generate-copy` já usa `https://integrate.api.nvidia.com/v1`. Nenhuma ação extra.

## 5. Resumo das chaves para automação total

| Plataforma | Chave/Config                     | Onde fica                     | Obrigatória? | Status hoje            |
|------------|----------------------------------|-------------------------------|--------------|------------------------|
| Supabase   | `NEXT_PUBLIC_SUPABASE_URL/ANON` + `SERVICE_ROLE` | `.env.local` | Sim (modo real) | ✅ configurado          |
| NVIDIA     | `NVIDIA_API_KEY`                 | `.env.local`                  | Sim (copy IA)| ✅ configurado          |
| Shopee     | `affiliate_id_shopee`            | `profiles` no banco           | Não (manual ok)| ⚠️ manual/CSV pronto  |
| TikTok     | `TIKTOK_CLIENT_KEY/SECRET/TOKEN` | `.env.local` (server)         | Não          | ❌ adapter pendente     |
| Evolution  | `EVOLUTION_API_URL/KEY` + instância | `.env.local` (server)     | Sim (WhatsApp)| ⚠️ lib pronta, Docker pendente |

## 6. Débito técnico conhecido (para automação completa)

1. **TikTok adapter** — implementar `lib/product-sources/tiktok.ts` que chama a TikTok Shop
   Open API para (a) buscar produtos por nicho e (b) gerar `affiliate_link` assinado.
2. **Shopee adapter** — `lib/product-sources/shopee.ts` que monta deep link a partir de
   `affiliate_id` + `product_id`.
3. **ECC (Enterprise Creator Collaboration)** — mencionado no plano original; não iniciado.
4. **OAuth de tokens de longa duração** — TikTok/Evolution tokens expiram; precisa de
   refresh automático (CRON ou route protegida).

## 7. Próximo passo imediato (se quiser automação Shopee hoje)

Como a Shopee exige rede de afiliados, o caminho mais rápido é:
1. Criar conta na rede de afiliados da Shopee e pegar seu `affiliate_id`.
2. Adicionar `affiliate_id_shopee` ao `profiles` (já há coluna no schema).
3. Implementar `buildShopeeLink(productId, affiliateId)` em `lib/product-sources/shopee.ts`
   (deep link padrão). ~30 linhas.
4. No momento de "Divulgar", o app usa `affiliate_link` em vez de `original_link`.

Assim o link de comissão é montado sozinho, sem colar nada manualmente.
