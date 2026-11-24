import {
  resolveApiBasePattern,
  resolveDefaultNetwork,
  resolveNetworks,
  resolveNetworkConfig,
  resolveWsUrlPattern,
} from '@/lib/runtime-config';

import { stripAppBase } from '@/lib/app-base';

// Re-export so `active-network` is the single facade for network resolution.
export { resolveDefaultNetwork } from '@/lib/runtime-config';

export function isKnownNetwork(name: string): boolean {
  return resolveNetworks().includes(name);
}

export function networkFromPath(pathname: string): string | null {
  const seg = stripAppBase(pathname).replace(/^\/+/, '').split('/')[0] ?? '';
  return seg && isKnownNetwork(seg) ? seg : null;
}

export function resolveActiveNetwork(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
): string {
  return networkFromPath(pathname) ?? resolveDefaultNetwork();
}

/**
 * Prefix an internal href with the active `network` segment.
 *
 * - Leaves external / relative (non-`/`) hrefs untouched.
 * - Leaves hrefs that are already network-prefixed untouched (idempotent).
 * - Otherwise prepends `/<network>` (root `/` maps to `/<network>`).
 */
export function prefixNetwork(href: string, network: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href; // external / relative — leave
  const first = href.replace(/^\/+/, '').split('/')[0] ?? '';
  if (isKnownNetwork(first)) return href; // already prefixed
  return `/${network}${href === '/' ? '' : href}`;
}

export function apiBaseFor(network: string): string {
  const override = resolveNetworkConfig(network)?.apiBase?.trim();
  return (override || resolveApiBasePattern().replace('{network}', network)).replace(/\/+$/, '');
}

export function wsUrlFor(network: string): string {
  const override = resolveNetworkConfig(network)?.wsUrl?.trim();
  if (override) return override;
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin.replace(/^http/, 'ws')
      : 'ws://localhost:8100';
  const target = resolveWsUrlPattern().replace('{network}', network);
  return /^wss?:\/\//i.test(target) ? target : `${origin}${target}`;
}
