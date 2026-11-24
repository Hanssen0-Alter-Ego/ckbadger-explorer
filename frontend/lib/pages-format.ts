import { isKnownNetwork, networkFromPath, resolveDefaultNetwork } from '@/lib/active-network';
import { stripAppBase } from '@/lib/app-base';
import { resolveNetworkConfig } from '@/lib/runtime-config';

/** Pages cannot implement HTTP Accept negotiation; browser navigation can delegate it. */
export function pagesFormatDestination(url: URL): string | null {
  const path = stripAppBase(url.pathname);
  const requested = url.searchParams.get('format')?.toLowerCase();
  if (requested === 'html') return null;
  if (requested !== 'md' && requested !== 'raw' && !/\.(md|raw)$/.test(path)) return null;

  const leading = path.split('/')[1]?.replace(/\.(md|raw)$/, '');
  if ((leading === 'mainnet' || leading === 'testnet') && !isKnownNetwork(leading)) return null;
  const matched = networkFromPath(path);
  const networkRoot = path.match(/^\/([^/]+)\.(md|raw)$/);
  const suffixedNetwork = networkRoot && isKnownNetwork(networkRoot[1]) ? networkRoot[1] : null;
  const network = matched ?? suffixedNetwork ?? resolveDefaultNetwork();
  const pageBase = resolveNetworkConfig(network)?.pageBase;
  if (!pageBase) return null;
  let destination: URL;
  try {
    destination = new URL(pageBase);
  } catch {
    return null;
  }
  if (destination.protocol !== 'https:' || destination.username || destination.password) return null;
  const pathSuffix = matched ? path.slice(matched.length + 1) : suffixedNetwork
    ? `.${networkRoot?.[2]}`
    : path;
  destination.pathname = destination.pathname.replace(/\/+$/, '') + (pathSuffix === '/' ? '' : pathSuffix);
  destination.search = url.search;
  destination.hash = url.hash;
  return destination.href === url.href ? null : destination.href;
}
