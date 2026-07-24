import { NextRequest, NextResponse } from 'next/server';
import { listInstances, evolutionConfigured } from '@/lib/evolution';

export async function GET() {
  if (!evolutionConfigured()) {
    return NextResponse.json({ error: 'Evolution não configurada' }, { status: 503 });
  }
  try {
    const instances = await listInstances();
    return NextResponse.json({ instances });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
