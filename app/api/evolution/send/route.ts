import { NextRequest, NextResponse } from 'next/server';
import { sendText, evolutionConfigured } from '@/lib/evolution';

export async function POST(req: NextRequest) {
  if (!evolutionConfigured()) {
    return NextResponse.json({ error: 'Evolution não configurada' }, { status: 503 });
  }
  let body: { instance?: string; groupJid?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const { instance, groupJid, text } = body;
  if (!instance || !groupJid || !text) {
    return NextResponse.json({ error: 'instance, groupJid e text são obrigatórios' }, { status: 400 });
  }
  try {
    const res = await sendText(instance, groupJid, text);
    if (!res.success) return NextResponse.json({ error: res.error }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
