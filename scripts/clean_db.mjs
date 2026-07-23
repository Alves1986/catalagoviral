import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^\"|\"$/g, '') : null;
};
const URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SRK = get('SUPABASE_SERVICE_ROLE_KEY');

const sb = createClient(URL, SRK, { auth: { autoRefreshToken: false, persistSession: false } });

async function delAll(table) {
  let deleted = 0;
  for (;;) {
    const { data, error } = await sb.from(table).select('id').limit(1000);
    if (error) { console.log(`ERRO ao ler ${table}:`, error.message); return deleted; }
    if (!data || data.length === 0) break;
    const ids = data.map((r) => r.id);
    const { error: e2 } = await sb.from(table).delete().in('id', ids);
    if (e2) { console.log(`ERRO ao apagar ${table}:`, e2.message); return deleted; }
    deleted += ids.length;
    if (data.length < 1000) break;
  }
  console.log(`${table}: ${deleted} removidos`);
  return deleted;
}

async function main() {
  // Ordem importa por causa de FKs
  await delAll('link_events').catch(() => {});
  await delAll('generated_links');
  await delAll('products');
  await delAll('profiles');
  await delAll('organizations');

  // Usuários auth
  const { data: list } = await sb.auth.admin.listUsers();
  for (const u of (list.users || [])) {
    try {
      await sb.auth.admin.deleteUser(u.id);
      console.log('usuário auth apagado:', u.email);
    } catch (e) {
      console.log('erro ao apagar usuario', u.email, e.message);
    }
  }
  console.log('LIMPEZA CONCLUÍDA');
}
main().catch((e) => { console.error(e); process.exit(1); });
