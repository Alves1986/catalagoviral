import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// Next.js 16: params é assíncrono.
// Usa service role (server-only) para ler o link público sem RLS de usuário —
// cliques em links são anônimos, então não há auth.uid() aqui.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseServer;
  if (!sb) return new NextResponse('Backend não configurado', { status: 503 });

  // 1) valida existência e pega o link original ANTES de contar
  const { data, error } = await sb
    .from('generated_links')
    .select('id, product_id, products(original_link)')
    .eq('id', id)
    .single();
  if (error || !data) return new NextResponse('Link não encontrado', { status: 404 });

  const originalLink = (data.products as { original_link?: string } | undefined)?.original_link ?? null;
  if (!originalLink) return new NextResponse('Link sem destino', { status: 404 });

  // 2) só agora incrementa (RPC atômica)
  await sb.rpc('increment_link_clicks', { link_id: id });

  return NextResponse.redirect(originalLink, 302);
}
