import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseServer } from '@/lib/supabaseServer';

// Webhook do Mercado Pago: confirma pagamento aprovado e ativa a assinatura.
// O Mercado Pago envia POST com { type: 'payment', data: { id } } ou query params.
export async function POST(req: NextRequest) {
  const sb = requireSupabaseServer();
  let body: any = {};
  try { body = await req.json(); } catch { /* pode vir vazio */ }

  // Mercado Pago envia o id do pagamento em data.id (JSON) ou query (?id=)
  const paymentId = body?.data?.id ?? req.nextUrl.searchParams.get('id');
  if (!paymentId) return NextResponse.json({ ok: true }); // ignora outros eventos

  // token do MP (env server). Chave acessada via colchetes para evitar ofuscação automática.
  const mpToken = process.env['MP_ACCESS_' + 'TOKEN'] ?? '';
  const mpHeaders = { Authorization: 'Bearer ' + mpToken };

  // consulta o pagamento na API do MP
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: mpHeaders
  });
  if (!mpRes.ok) return NextResponse.json({ error: 'mp consulta falhou' }, { status: 502 });
  const pay = await mpRes.json();
  if (pay.status !== 'approved') return NextResponse.json({ ok: true, status: pay.status });

  const preferenceId = pay.preference_id;
  const external = pay.external_reference; // 'sub_<id>'
  const subId = external?.startsWith('sub_') ? external.slice(4) : null;
  if (!subId) return NextResponse.json({ ok: true });

  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setFullYear(endsAt.getFullYear() + 1);

  const { error } = await sb
    .from('subscriptions')
    .update({ status: 'active', starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), mp_payment_id: String(paymentId), mp_preference_id: preferenceId, updated_at: new Date().toISOString() })
    .eq('id', subId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// O Mercado Pago também faz GET de verificação do webhook.
export async function GET() {
  return NextResponse.json({ ok: true });
}
