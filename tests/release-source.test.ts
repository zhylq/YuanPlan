import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const directories: string[] = [];
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'yuanplan-release-guard-')); directories.push(directory);
  await mkdir(join(directory, 'scripts'));
  await copyFile(resolve('scripts/check-release.mjs'), join(directory, 'scripts/check-release.mjs'));
  execFileSync('git', ['init', '--quiet'], { cwd: directory });
  return directory;
}
function check(directory: string) {
  return spawnSync(process.execPath, [join(directory, 'scripts/check-release.mjs')], { cwd: directory, encoding: 'utf8' });
}
it('accepts public templates and synthetic example deployment addresses', async () => {
  const directory = await fixture(); await mkdir(join(directory, 'deploy/examples'), { recursive: true });
  await writeFile(join(directory, '.env.example'), 'AUTH_SECRET=replace-with-random-value');
  await writeFile(join(directory, 'deploy/examples/config.example.json'), '{"origin":"https://ci.example.com"}');
  expect(check(directory).status).toBe(0);
});
it('rejects a tracked environment file even though local environment files are skipped', async () => {
  const directory = await fixture(); await writeFile(join(directory, '.env'), 'SECRET=synthetic-test-only');
  execFileSync('git', ['add', '-f', '.env'], { cwd: directory });
  const result = check(directory); expect(result.status).toBe(1); expect(result.stderr).toContain('.env: tracked private file');
  expect(result.stderr).not.toContain('synthetic-test-only');
});
it('rejects a real deployment host without echoing configuration contents', async () => {
  const directory = await fixture(); await mkdir(join(directory, 'deploy/examples'), { recursive: true });
  await writeFile(join(directory, 'deploy/examples/config.json'), '{"origin":"https://production.company.invalid","token":"synthetic-secret"}');
  const result = check(directory); expect(result.status).toBe(1); expect(result.stderr).toContain('non-example deployment host');
  expect(result.stderr).not.toContain('synthetic-secret');
});
it('rejects broken local documentation links', async () => {
  const directory = await fixture(); await writeFile(join(directory, 'README.md'), '[Setup](missing.md)');
  const result = check(directory); expect(result.status).toBe(1); expect(result.stderr).toContain('broken local link');
});
