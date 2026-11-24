/** @type {import('next').NextConfig} */
const basePath = (process.env.PAGES_BASE || '').replace(/\/+$/, '');

if (basePath && !/^\/[a-zA-Z0-9_.-]+$/.test(basePath)) {
  throw new Error('PAGES_BASE must be a single project path, e.g. /ckbadger-explorer/');
}

export default {
  output: 'export',
  basePath,
  reactStrictMode: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_PAGES_BASE: basePath },
  // The existing explorer components live one level above this small host shell.
  experimental: { externalDir: true, cpus: 2 },
};
