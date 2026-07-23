import { NextRequest, NextResponse } from 'next/server';
import { fetchTopProducts, getCurrentUser, isDemoMode } from '@/lib/data';
import type { Product } from '@/types';

// Mock de copy (usado no modo demo / quando não há OPENAI_API_KEY).
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

export async function POST(req: NextRequest) {
  try {
    const { product_id } = await req.json();
    if (!product_id) return NextResponse.json({ error: 'product_id obrigatório' }, { status: 400 });

    // busca o produto (usa a camada de dados, funciona em mock e supabase)
    const list = await fetchTopProducts({ limit: 200, sortBy: 'sales' });
    const product = list.find((p) => p.id === product_id);
    if (!product) return NextResponse.json({ error: 'produto não encontrado' }, { status: 404 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && !isDemoMode()) {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });
      const prompt = `Você é um redator de vendas para afiliados de e-commerce.
Produto: ${product.name}
Preço de: ${product.originalPrice} | Preço promocional: ${product.promoPrice}
Comissão: ${product.commissionPct}%
Link: ${product.originalLink}

Retorne SOMENTE um JSON válido (sem markdown, sem texto extra) no formato:
{
  "copies": ["texto 1 para WhatsApp com emojis e CTA", "texto 2", "texto 3"],
  "videoScript": "roteiro de vídeo de 30 segundos para TikTok/Reels"
}`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = JSON.parse(completion.choices[0].message.content ?? '{}');
      return NextResponse.json({ copies: parsed.copies ?? [], videoScript: parsed.videoScript ?? '' });
    }

    // fallback mock (modo demo ou sem chave)
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json(mockCopy(product));
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao gerar copy. Tente novamente.' }, { status: 500 });
  }
}
