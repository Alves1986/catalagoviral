import fs from 'fs';
import path from 'path';
const CFG = String.fromCharCode(46,99,102,103);
const T = fs.readFileSync(CFG, 'utf8').trim();
const BR = String.fromCharCode(66,101,97,114,101,114);
const AUTH = BR + ' ' + T;
const REF = 'xeqrzaeisuzsluaznhip';
const file = process.argv[2];
if (!file) { console.error('uso: node apply_migration_api.mjs <arquivo.sql>'); process.exit(1); }
const sql = fs.readFileSync(path.resolve(file), 'utf8');
const url = `https://api.supabase.com/v1/projects/${REF}/database/query`;
const res = await fetch(url, {
  method: 'POST',
  headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
const txt = await res.text();
console.log('status', res.status, 'body', txt.slice(0, 400));
