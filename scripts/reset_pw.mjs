import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^\"|\"$/g, '') : null;
};
const URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SRK = get('SUPABASE_SERVICE_ROLE_KEY');
const EMAIL = 'cassia.andinho@gmail.com';

const sb = createClient(URL, SRK, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const { data: list } = await sb.auth.admin.listUsers();
  const u = list.users.find((x) => x.email === EMAIL);
  if (!u) { console.log('não encontrado'); return; }
  const id = u.id;
  console.log('tentando deleteUser id=', id);
  try {
    const r = await sb.auth.admin.deleteUser(id);
    console.log('deleteUser ok:', JSON.stringify(r));
  } catch (e) {
    console.log('deleteUser erro:', e.message);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
