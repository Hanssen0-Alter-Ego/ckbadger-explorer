import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const out = fileURLToPath(new URL('../site/out/', import.meta.url));
const base = (process.env.PAGES_BASE || '').replace(/\/+$/, '');
const index = await readFile(resolve(out, 'index.html'), 'utf8');
const fallback = await readFile(resolve(out, '404.html'), 'utf8');
assert.ok(index.includes(`${base}/_next/static/`), 'Next.js chunks must use the Pages base.');
assert.ok(index.includes(`${base}/runtime-config.js`), 'Runtime config must use the Pages base.');
assert.ok(fallback.includes('__NEXT_DATA__') && fallback.includes('noindex'));
assert.ok((await stat(resolve(out, '.nojekyll'))).isFile());
for (const page of ['mainnet', 'mainnet/blocks', 'mainnet/transactions', 'mainnet/inventory/tokens', 'mainnet/charts']) {
  assert.equal(await readFile(resolve(out, page, 'index.html'), 'utf8'), index);
}
const window = {};
runInNewContext(await readFile(resolve(out, 'runtime-config.js'), 'utf8'), { window }, { timeout: 1000 });
const config = window.__CKBADGER_RUNTIME_CONFIG__;
assert.ok(config.networks.some((network) => network.name === config.defaultNetwork));
console.log('Verified Next.js export, project-scoped runtime and chunks, known routes and dynamic fallback.');
