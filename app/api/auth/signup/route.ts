import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseServer } from '@/lib/supabaseServer';

// Cadastro: cria o usuário (auth.users), a organization e o profile vinculado.
// Usa service role (server-only) — contorna a ausência de trigger no banco.
export async function POST(req: NextRequest) {
  try {
    const { email, password, orgName } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email e senha são obrigatórios' }, { status: 400 });
    }
    const sb = requireSupabaseServer();

    // 1) cria o usuário (e-mail já confirmado para uso imediato)
    const { data: created, error: ue } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { org_name: orgName || 'Minha Organização' },
    });
    if (ue) {
      if (/already been registered/.test(ue.message)) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado. Use "Entrar".' }, { status: 409 });
      }
      return NextResponse.json({ error: ue.message }, { status: 400 });
    }
    const uid = created.user.id;

    // 2) organization
    const { data: org, error: oe } = await sb
      .from('organizations')
      .insert({ name: orgName || 'Minha Organização' })
      .select('id')
      .single();
    if (oe) return NextResponse.json({ error: oe.message }, { status: 400 });
    const orgId = org.id;

    // 3) profile
    const { error: pe } = await sb
      .from('profiles')
      .upsert({ id: uid, organization_id: orgId });
    if (pe) return NextResponse.json({ error: pe.message }, { status: 400 });

    return NextResponse.json({ ok: true, userId: uid, organizationId: orgId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
