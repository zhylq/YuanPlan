import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const ignored = new Set(['.git', '.data', '.idea', '.vscode', '.codex', '.agents', '.npm-cache', '.cache', 'node_modules', 'dist', 'coverage', 'test-results', 'playwright-report', '__pycache__']);
const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || (entry.name.startsWith('.env') && entry.name !== '.env.example')) continue;
    const target = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${path.relative(root, target)}`);
    if (entry.isDirectory()) await walk(target);
    else if (entry.isFile()) files.push(target);
  }
}
await walk(root);
const errors = [];
try {
  await fs.access(path.join(root, '.git'));
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of tracked) {
    if (/^(?:\.data|\.codex|\.agents|\.idea|node_modules)\//.test(file) || (/(?:^|\/)\.env(?:$|\.)/.test(file) && !file.endsWith('/.env.example') && file !== '.env.example') || /\.(?:env|pem|key|dump|dpapi|bundle|tar|gz|zip)$/.test(file)) errors.push(file + ': tracked private file');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const patterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, /\bgithub_pat_[A-Za-z0-9_]{30,}\b/, /\bAKIA[A-Z0-9]{16}\b/];
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  if (/\.(?:dump|dpapi|pem|key|bundle|tar|gz|zip)$/.test(relative)) { errors.push(`${relative}: private archive or key`); continue; }
  if (!/\.(?:md|mjs|ts|tsx|json|yml|yaml|sh|py|sql|html|svg|txt)$/.test(file) && !/Dockerfile/.test(relative)) continue;
  const text = await fs.readFile(file, 'utf8');
  if (patterns.some(pattern => pattern.test(text))) errors.push(`${relative}: possible credential`);
  if (relative.startsWith('deploy/') && /https?:\/\//.test(text)) {
    for (const match of text.matchAll(/https?:\/\/(?:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+@)?([a-zA-Z0-9.-]+)/g)) {
      const host = match[1];
      if (!['127.0.0.1', 'localhost'].includes(host) && !/(?:^|\.)(?:example\.(?:com|org|net)|example|test)$/.test(host)) errors.push(`${relative}: non-example deployment host`);
    }
  }
  if (relative.endsWith('.md')) {
    if ((text.match(/^```/gm) ?? []).length % 2) errors.push(`${relative}: unclosed code block`);
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const dest = match[1];
      if (/^(?:https?:|mailto:|#|skill:)/.test(dest)) continue;
      try { await fs.access(path.resolve(path.dirname(file), dest.split('#')[0])); }
      catch { errors.push(`${relative}: broken local link ${dest}`); }
    }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Release source checks passed (${files.length} files): links, example deployment hosts and common credential patterns`);
