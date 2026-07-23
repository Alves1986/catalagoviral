import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchTopProducts, isDemoMode } from '@/lib/data';
import type { Product } from '@/types';

// Mock de copy (usado no modo demo / quando não há NVIDIA_API_KEY).
function mockCopy(p: Product): { copies: string[]; videoScript: string } {
  const preco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.promoPrice);
  const de = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.originalPrice);
  return {
    copies: [
      `🔥 PROMO RELÂMPAGO!\n${p.name} por apenas ${preco} (de ${de}).\nComissão de ${p.commissionPct}% pra quem indica. Corre que voa! 👇\n${p.originalLink}`,
      `😱 Não reclamei do preço, reclamei da demora! ${p.name} a ${preco}.\nAproveita antes que volte pro preço cheio. Link nos comentários ⬇️`,
      `✅ Achado do dia: ${p.name} por ${preco}.\nQualidade boa e frete fácil. Quem quiser, chama no privado ou clica aqui 👇\n${p.originalLink}`,
    ],
    videoScript: `⏱️ ROTEIRO 30s — ${p.name}\n[0-3s] Plano fechado no produto + texto "Esse achado tá imperdível"\n[3-12s] Mostra o produto em uso, destaque o preço ${preco} (de ${de})\n[12-22s] Benefícios rápidos + "link na bio / nos comentários"\n[22-30s] CTA: "Corre antes que acaba!" + seta apontando pro link.`,
  };
}

// Extrai o primeiro objeto JSON de um texto (a Nvidia não suporta response_format json).
function extractJson(text: string): { copies?: string[]; videoScript?: string } {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
  } catch {
    // ignora e cai no fallback abaixo
  }
  return {};
}

export async function POST(req: NextRequest) {
  try {
    const { product_id } = await req.json();
    if (!product_id) return NextResponse.json({ error: 'product_id obrigatório' }, { status: 400 });

    const list = await fetchTopProducts({ limit: 200, sortBy: 'sales' });
    let product = list.find((p) => p.id === product_id);

    // Em modo real, a lista vem do banco filtrado por org do usuário logado.
    // Na route handler não há sessão do usuário, então buscamos por id com service role.
    if (!product && !isDemoMode()) {
      const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (svcUrl && svcKey) {
        const admin = createClient(svcUrl, svcKey, { auth: { persistSession: false } });
        const { data } = await admin.from('products').select('*').eq('id', product_id).maybeSingle();
        if (data) product = data as unknown as Product;
      }
    }
    if (!product) return NextResponse.json({ error: 'produto não encontrado' }, { status: 404 });

    const apiKey = process.env.NVIDIA_API_KEY;
    if (apiKey && !isDemoMode()) {
      try {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({
          apiKey,
          baseURL: 'https://integrate.api.nvidia.com/v1',
        });
        const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';
        const prompt = `Você é um redator de vendas brasileiro para afiliados de e-commerce.
Use OBRIGATORIAMENTE os dados reais abaixo (não use colchetes nem placeholders):
- Nome do produto: ${product.name}
- Preço original: R$ ${product.originalPrice}
- Preço promocional: R$ ${product.promoPrice}
- Comissão: ${product.commissionPct}%
- Link de afiliado: ${product.originalLink}

Regras:
1. Escreva em PORTUGUÊS do Brasil, com emojis e tom de urgência.
2. NÃO use [link], [preço] ou qualquer placeholder. Use os valores reais acima.
3. Responda SOMENTE com um objeto JSON válido (sem markdown), no formato exato:
{
  "copies": ["texto 1 para WhatsApp", "texto 2 para WhatsApp", "texto 3 para WhatsApp"],
  "videoScript": "roteiro de vídeo de 30 segundos para TikTok/Reels, com tempos"
}`;

        const completion = await client.chat.completions.create({
          model,
          temperature: 0.9,
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        });
        const content = completion.choices[0]?.message?.content ?? '';
        const parsed = extractJson(content);
        if (parsed.copies?.length) {
          return NextResponse.json({
            copies: parsed.copies.slice(0, 3),
            videoScript: parsed.videoScript ?? '',
          });
        }
      } catch (aiErr) {
        console.error('Nvidia API falhou, usando mock:', aiErr);
        // cai no mock abaixo em caso de erro de API
      }
    }

    // fallback mock (modo demo, sem chave, ou erro de API)
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json(mockCopy(product));
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao gerar copy. Tente novamente.' }, { status: 500 });
  }
}
