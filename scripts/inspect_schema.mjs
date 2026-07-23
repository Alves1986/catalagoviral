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
  const { data, error } = await sb.from('profiles').select('*').limit(1);
  if (error) { console.log('ERRO profiles:', error.message); return; }
  console.log('colunas profiles:', data && data[0] ? Object.keys(data[0]).join(', ') : '(tabela vazia)');
  const { data: d2, error: e2 } = await sb.from('link_events').select('*').limit(1).maybeSingle();
  console.log('link_events existe?', e2 ? ('ERRO: ' + e2.message) : (d2 !== null ? 'sim/com dados' : 'sim/vazia'));
}
main().catch((e) => { console.error(e); process.exit(1); });
