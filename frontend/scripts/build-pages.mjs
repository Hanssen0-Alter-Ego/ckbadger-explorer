import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const frontend = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(frontend, 'site/out');
const entry = await readFile(resolve(output, 'index.html'), 'utf8');
const routingSource = await readFile(resolve(frontend, 'src/routes/router.tsx'), 'utf8');
const configSource = await readFile(resolve(output, 'runtime-config.js'), 'utf8');
// Materialize known static route entrypoints; dynamic values go through 404.html.
const routePaths = [...routingSource.matchAll(/^\s*path: '([a-z0-9/-]+)',/gm)]
  .map((entry) => entry[1])
  .filter((path) => !path.startsWith('/'));
const window = {};
runInNewContext(configSource, { window }, { timeout: 1000, filename: 'runtime-config.js' });
const networkNames = window.__CKBADGER_RUNTIME_CONFIG__?.networks?.map((network) => network.name);
if (!networkNames?.length || networkNames.some((name) => !/^[a-z0-9-]+$/.test(name))) {
  throw new Error('List at least one enabled network with a valid name in runtime-config.js');
}
for (const network of new Set(networkNames)) {
  for (const page of new Set(['', ...routePaths])) {
    const path = resolve(output, network, page);
    await mkdir(path, { recursive: true });
    await writeFile(resolve(path, 'index.html'), entry);
  }
}
await writeFile(resolve(output, '404.html'), entry.replace('<head>', '<head><meta name="robots" content="noindex" />'));
await writeFile(resolve(output, '.nojekyll'), '');
await copyFile(resolve(frontend, '../LICENSE'), resolve(output, 'LICENSE'));
const disclaimer = [
  '# CKBadger Explorer (GitHub Pages)\n',
  'This static site serves HTML and live explorer views. For native Markdown/RAW responses',
  'and HTTP Accept negotiation, use the configured CKBadger server directly rather than Pages.\n',
].join('\n');
for (const name of ['llms.txt', 'llms-full.txt']) {
  const path = resolve(output, name);
  await writeFile(path, disclaimer + (await readFile(path, 'utf8')).replace('<!-- REGISTERED_PAGE_FORMATS -->', 'Format and profile availability depends on the configured server.'));
}
