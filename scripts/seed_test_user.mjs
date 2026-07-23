import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^\"|\"$/g, '') : null;
};
const URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SRK = get('SUPABASE_SERVICE_ROLE_KEY');
if (!URL || !SRK) { console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local'); process.exit(1); }

const EMAIL = 'cassia.andinho@gmail.com';
const PASSWORD = 'Teste@CatalogoViral2026';
const sb = createClient(URL, SRK, { auth: { autoRefreshToken: false, persistSession: false } });

const products = [
  { name: 'Fone Bluetooth Earbuds Pro 5', image_url: 'https://images.unsplash.com/photo-1606220838315-28d5ad5a82a5?w=600&q=80', original_price: 199.9, promo_price: 89.9, commission_pct: 12, source: 'shopee', category: 'eletronicos', hot: true, sales_rank: 5, original_link: 'https://shopee.com.br/produto-fone' },
  { name: 'Smartwatch GPS Amoled 1.9"', image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80', original_price: 349.0, promo_price: 179.9, commission_pct: 15, source: 'tiktok', category: 'eletronicos', hot: true, sales_rank: 2, original_link: 'https://tiktok.com/shop/smartwatch' },
  { name: 'Kit Organizador de Cabos Magnético', image_url: 'https://images.unsplash.com/photo-1591290619767-3d6c6d43d3c9?w=600&q=80', original_price: 49.9, promo_price: 24.9, commission_pct: 20, source: 'manual', category: 'casa', hot: false, sales_rank: 0, original_link: 'https://exemplo.com/organizador' },
  { name: 'Luminária LED RGB com Controle App', image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80', original_price: 129.9, promo_price: 59.9, commission_pct: 18, source: 'shopee', category: 'casa', hot: true, sales_rank: 8, original_link: 'https://shopee.com.br/produto-luminaria' },
  { name: 'Cafeteira Elétrica Inox 1.5L', image_url: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=600&q=80', original_price: 259.9, promo_price: 139.9, commission_pct: 10, source: 'tiktok', category: 'casa', hot: false, sales_rank: 0, original_link: 'https://tiktok.com/shop/cafeteira' },
  { name: 'Mochila Antifurto USB Carregável', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', original_price: 199.0, promo_price: 99.9, commission_pct: 14, source: 'manual', category: 'moda', hot: true, sales_rank: 3, original_link: 'https://exemplo.com/mochila' },
];

async function main() {
  // 1) Usuário (idempotente)
  let uid;
  const { data: existing } = await sb.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === EMAIL);
  if (found) {
    uid = found.id;
    console.log('usuário já existe:', uid, '-> redefinindo senha via updateUserById');
    try {
      const { error: upErr } = await sb.auth.admin.updateUserById(uid, { password: PASSWORD });
      if (upErr) console.log('aviso updateUserById:', upErr.message);
      else console.log('senha redefinida OK');
    } catch (e) { console.log('erro updateUserById:', e.message); }
    // garante confirmação de email
    try { await sb.from('auth.users').update({ email_confirmed_at: new Date().toISOString() }).eq('id', uid); } catch (e) {}
  } else {
    const { data: created, error: ue } = await sb.auth.admin.createUser({
      email: EMAIL, password: PASSWORD, email_confirm: true,
    });
    if (ue) { console.error('ERRO user:', ue.message); process.exit(1); }
    uid = created.user.id;
    console.log('usuário criado:', uid);
  }

  // 2) Org (idempotente por nome)
  const { data: orgs } = await sb.from('organizations').select('id').eq('name', 'Catálogo Viral (teste)').maybeSingle();
  let orgId;
  if (orgs?.id) {
    orgId = orgs.id;
    console.log('org já existe:', orgId);
  } else {
    const { data: org, error: oe } = await sb.from('organizations').insert({ name: 'Catálogo Viral (teste)' }).select('id').single();
    if (oe) { console.error('ERRO org:', oe.message); process.exit(1); }
    orgId = org.id;
    console.log('org criada:', orgId);
  }

  // 3) Profile (upsert)
  const { error: pe } = await sb.from('profiles').upsert({
    id: uid, organization_id: orgId, affiliate_id_shopee: null, affiliate_id_tiktok: null,
  });
  if (pe) { console.error('ERRO profile:', pe.message); process.exit(1); }
  console.log('profile ok');

  // 4) Produtos (só se a org não tiver nenhum)
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
  if (!count) {
    const { error: prde } = await sb.from('products').insert(products.map((p) => ({ ...p, organization_id: orgId, active: true })));
    if (prde) { console.error('ERRO produtos:', prde.message); process.exit(1); }
    console.log('produtos inseridos:', products.length);
  } else {
    console.log('produtos já existem (' + count + '), pulando');
  }

  console.log('\n=== ACESSO DE TESTE ===');
  console.log('E-mail:', EMAIL);
  console.log('Senha:', PASSWORD);
}

main().catch((e) => { console.error(e); process.exit(1); });
