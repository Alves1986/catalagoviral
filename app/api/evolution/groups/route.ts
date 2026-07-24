import { NextRequest, NextResponse } from 'next/server';
import { fetchGroups, evolutionConfigured } from '@/lib/evolution';

export async function GET(req: NextRequest) {
  if (!evolutionConfigured()) {
    return NextResponse.json({ error: 'Evolution não configurada' }, { status: 503 });
  }
  const instance = req.nextUrl.searchParams.get('instance');
  if (!instance) {
    return NextResponse.json({ error: 'parâmetro instance obrigatório' }, { status: 400 });
  }
  try {
    const groups = await fetchGroups(instance);
    return NextResponse.json({ groups });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
