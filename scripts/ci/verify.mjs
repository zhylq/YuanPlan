import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { smoke } from './smoke.mjs';

const root = resolve(import.meta.dirname, '../..');
const url = new URL(process.env.TEST_DATABASE_URL ?? '');
if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.pathname !== '/yuanplan_ci_test') {
  throw new Error('TEST_DATABASE_URL must point to the disposable yuanplan_ci_test database');
}
if (!['db', '127.0.0.1', 'localhost'].includes(url.hostname)) {
  throw new Error('CI accepts only its db service or a local disposable database');
}
const scratch = await mkdtemp(join(tmpdir(), 'yuanplan-ci-'));
// Never inherit production database URLs, mail credentials or a local .env.
const env = Object.fromEntries(['PATH', 'HOME', 'SystemRoot', 'TEMP', 'TMP', 'PATHEXT'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
Object.assign(env, {
  CI: 'true', NODE_ENV: 'test', DOTENV_CONFIG_PATH: join(scratch, 'absent.env'),
  TEST_DATABASE_URL: url.href, DATABASE_URL: url.href, MIGRATION_DATABASE_URL: url.href,
  AUTH_SECRET: randomBytes(32).toString('hex'), SETUP_TOKEN: randomBytes(24).toString('hex'),
  APP_URL: 'http://127.0.0.1:18420', PORT: '18420',
  UPLOAD_DIR: join(scratch, 'uploads'), WEB_DIST: join(root, 'apps/web/dist'),
});
function run(command, args) {
  return new Promise((done, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code, signal) => code === 0 ? done() : reject(new Error(`${command} failed (${code ?? signal})`)));
  });
}
try {
  const npm = process.env.npm_execpath ?? resolve(process.execPath, process.platform === 'win32'
    ? '../node_modules/npm/bin/npm-cli.js' : '../../lib/node_modules/npm/bin/npm-cli.js');
  await run(process.execPath, [npm, 'ci']);
  await run(process.execPath, [npm, 'audit', '--audit-level=high']);
  await run(process.execPath, [npm, 'run', 'check:release']);
  const { default: pg } = await import('pg');
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const client = new pg.Client({ connectionString: url.href, connectionTimeoutMillis: 1000 });
    try { await client.connect(); await client.query('SELECT 1'); ready = true; break; }
    catch { await new Promise(r => setTimeout(r, 1000)); }
    finally { await client.end().catch(() => {}); }
  }
  if (!ready) throw new Error('Disposable PostgreSQL did not become ready');
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  try {
    const tables = await client.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' LIMIT 1");
    if (tables.rowCount) throw new Error('CI requires a fresh empty database; refusing to modify existing data');
  } finally { await client.end(); }
  // npm is invoked through Node, avoiding shell quoting and Windows npm.cmd.
  await run('pg_dump', ['--version']);
  await run('pg_restore', ['--version']);
  for (const task of ['typecheck', 'test', 'build']) {
    console.log(`[CI] ${task}`);
    await run(process.execPath, [npm, 'run', task]);
  }
  await smoke(root, env);
  console.log('[CI] All checks passed');
} finally { await rm(scratch, { recursive: true, force: true }); }
