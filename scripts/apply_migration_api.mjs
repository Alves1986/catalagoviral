// Aplica uma migration DDL no Supabase via Management API (database/query).
// Usa o PAT do .cfg (gitignored, sbp_...) autenticado em api.supabase.com.
// Uso: node scripts/apply_migration_api.mjs <arquivo.sql>
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const getEnv = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };
const SB = getEnv('NEXT_PUBLIC_SUPABASE_URL'); // https://<ref>.supabase.co
const match = SB.match(/https:\/\/([^.]+)\.supabase\.co/);
const REF = match ? match[1] : '';

const cfgPath = path.resolve('.cfg');
if (!fs.existsSync(cfgPath)) { console.error('falta .cfg (gitignored) com o token sbp_'); process.exit(1); }
const PAT = fs.readFileSync(cfgPath, 'utf8').trim().split('\n').find((l) => l.trim().startsWith('sbp_')) || '';
if (!REF || !PAT) { console.error('NEXT_PUBLIC_SUPABASE_URL (.env.local) ou token .cfg ausentes'); process.exit(1); }

const file = process.argv[2];
if (!file) { console.error('uso: node scripts/apply_migration_api.mjs <arquivo.sql>'); process.exit(1); }
const sql = fs.readFileSync(file, 'utf8');

const url = `https://api.supabase.com/v1/projects/${REF}/database/query`;
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: ['Bearer', PAT].join(' ') },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
console.log('status', res.status);
console.log(text.slice(0, 2000));
process.exit(res.ok ? 0 : 1);
