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

async function main() {
  // 1) Lista usuários auth
  const { data: list } = await sb.auth.admin.listUsers();
  const users = list.users || [];
  console.log('usuários auth:', users.length);
  for (const u of users) {
    console.log(' -', u.email, u.id);
  }

  // 2) Lista profiles
  const { data: profiles } = await sb.from('profiles').select('id, organization_id, email');
  console.log('profiles:', profiles?.length || 0);
  for (const p of (profiles || [])) {
    console.log(' -', p.id, 'org=', p.organization_id, 'email=', p.email);
  }

  // 3) Lista orgs
  const { data: orgs } = await sb.from('organizations').select('id, name');
  console.log('orgs:', orgs?.length || 0);
  for (const o of (orgs || [])) {
    console.log(' -', o.id, o.name);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
