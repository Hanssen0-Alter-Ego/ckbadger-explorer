/** GitHub Project Pages serves the app below a repository path. */
export function appBasePath(): string {
  return (process.env.NEXT_PUBLIC_PAGES_BASE || '').replace(/\/+$/, '');
}

export function stripAppBase(pathname: string, base = appBasePath()): string {
  if (!base) return pathname;
  if (pathname === base) return '/';
  return pathname.startsWith(base + '/') ? pathname.slice(base.length) : pathname;
}

export function withAppBase(href: string, base = appBasePath()): string {
  if (!base || !href.startsWith('/') || href.startsWith('//')) return href;
  if (href === base || href.startsWith(base + '/')) return href;
  return base + href;
}
