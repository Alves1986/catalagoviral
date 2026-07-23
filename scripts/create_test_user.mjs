import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^"|"$/g, '') : null;
};
const URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SRK = get('SUPABASE_SERVICE_ROLE_KEY');
if (!URL || !SRK) { console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local'); process.exit(1); }

const EMAIL = 'cassia.andinho@gmail.com';
const sb = createClient(URL, SRK, { auth: { autoRefreshToken: false, persistSession: false } });

const products = [
  { name: 'Fone Bluetooth Earbuds Pro 5', image_url: 'https://images.unsplash.com/photo-1606220838315-28d5ad5a82a5?w=600&q=80', original_price: 199.9, promo_price: 89.9, commission_pct: 12, source: 'shopee', original_link: 'https://shopee.com.br/produto-fone' },
  { name: 'Smartwatch GPS Amoled 1.9"', image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80', original_price: 349.0, promo_price: 179.9, commission_pct: 15, source: 'tiktok', original_link: 'https://tiktok.com/shop/smartwatch' },
  { name: 'Kit Organizador de Cabos Magnético', image_url: 'https://images.unsplash.com/photo-1591290619767-3d6c6d43d3c9?w=600&q=80', original_price: 49.9, promo_price: 24.9, commission_pct: 20, source: 'manual', original_link: 'https://exemplo.com/organizador' },
  { name: 'Luminária LED RGB com Controle App', image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80', original_price: 129.9, promo_price: 59.9, commission_pct: 18, source: 'shopee', original_link: 'https://shopee.com.br/produto-luminaria' },
  { name: 'Cafeteira Elétrica Inox 1.5L', image_url: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=600&q=80', original_price: 259.9, promo_price: 139.9, commission_pct: 10, source: 'tiktok', original_link: 'https://tiktok.com/shop/cafeteira' },
  { name: 'Mochila Antifurto USB Carregável', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', original_price: 199.0, promo_price: 99.9, commission_pct: 14, source: 'manual', original_link: 'https://exemplo.com/mochila' },
];

async function main() {
  // 1) Cria (ou pega) usuário
  let { data: u, error: ue } = await sb.auth.admin.createUser({
    email: EMAIL, email_confirm: true, password: 'Teste@CatalogoViral2026',
  });
  if (ue && /already been registered/.test(ue.message)) {
    const { data: list } = await sb.auth.admin.listUsers();
    u = { user: list.users.find(x => x.email === EMAIL) };
    ue = null;
  }
  if (ue) { console.error('ERRO ao criar usuário:', ue.message); process.exit(1); }
  const uid = u.user.id;
  console.log('user id =', uid);

  // 2) Org
  const { data: org, error: oe } = await sb.from('organizations').insert({ name: 'Catálogo Viral (teste)' }).select('id').single();
  if (oe) { console.error('ERRO org:', oe.message); process.exit(1); }
  const orgId = org.id;
  console.log('org id =', orgId);

  // 3) Profile (super admin da org)
  const { error: pe } = await sb.from('profiles').upsert({
    id: uid, organization_id: orgId, affiliate_id_shopee: null, affiliate_id_tiktok: null,
  });
  if (pe) { console.error('ERRO profile:', pe.message); process.exit(1); }
  console.log('profile ok');

  // 4) Produtos da org
  const rows = products.map(p => ({ ...p, organization_id: orgId, active: true }));
  const { error: prde } = await sb.from('products').insert(rows);
  if (prde) { console.error('ERRO produtos:', prde.message); process.exit(1); }
  console.log('produtos inseridos:', rows.length);

  console.log('\n=== ACESSO DE TESTE CRIADO ===');
  console.log('E-mail:', EMAIL);
  console.log('Senha:', 'Teste@CatalogoViral2026');
  console.log('Org:', orgId);
  console.log('Para entrar: use o botão "Enviar link mágico" (magic link) OU login por senha se habilitado.');
}

main().catch(e => { console.error(e); process.exit(1); });
