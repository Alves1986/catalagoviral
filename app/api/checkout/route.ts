import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireSupabaseServer } from '@/lib/supabaseServer';

// Valor da assinatura anual (em BRL). Configure via MP_ANNUAL_PRICE no .env.local.
const ANNUAL_PRICE = Number(process.env.MP_ANNUAL_PRICE ?? '197.00');

export async function POST(req: NextRequest) {
  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Mercado Pago não configurado (MP_ACCESS_TOKEN).' }, { status: 503 });
  }
  const { user, orgId } = await getUserFromRequest(req);
  if (!user || !orgId) {
    return NextResponse.json({ error: 'não autenticado' }, { status: 401 });
  }
  const sb = requireSupabaseServer();

  // cria (ou atualiza) a subscription como pendente
  const endsAt = new Date();
  endsAt.setFullYear(endsAt.getFullYear() + 1);
  const { data: sub, error: subErr } = await sb
    .from('subscriptions')
    .insert({ organization_id: orgId, plan: 'annual', status: 'pending', ends_at: endsAt.toISOString() })
    .select('id')
    .single();
  if (subErr || !sub) {
    return NextResponse.json({ error: subErr?.message ?? 'falha ao criar assinatura' }, { status: 500 });
  }

  // monta a preference no Mercado Pago
  const preference = {
    items: [
      {
        id: 'plan-anual',
        title: 'Catálogo Viral — Assinatura Anual',
        description: 'Acesso por 12 meses à plataforma de gestão de links de afiliado.',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: ANNUAL_PRICE,
      },
    ],
    external_reference: `sub_${sub.id}`,
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/planos?status=success`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/planos?status=failure`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/planos?status=pending`,
    },
    auto_return: 'approved',
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/mp/webhook`,
  };

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    body: JSON.stringify(preference),
  });
  const mpJson = await mpRes.json();
  if (!mpRes.ok) {
    return NextResponse.json({ error: mpJson.message ?? 'falha ao criar preference' }, { status: 502 });
  }

  // grava o preference_id na subscription
  await sb.from('subscriptions').update({ mp_preference_id: mpJson.id }).eq('id', sub.id);

  return NextResponse.json({ initPoint: mpJson.init_point, preferenceId: mpJson.id });
}
