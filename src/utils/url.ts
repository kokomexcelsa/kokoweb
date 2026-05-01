const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path = '/'): string {
  if (
    /^https?:\/\//.test(path) ||
    path.startsWith('//') ||
    path.startsWith('#') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:')
  ) {
    return path;
  }

  if (path === '/') {
    return `${base}/`;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function withoutBase(pathname: string): string {
  if (!base || !pathname.startsWith(base)) {
    return pathname;
  }

  const stripped = pathname.slice(base.length);
  return stripped || '/';
}

export function normalizeCurrentPath(pathname: string): string {
  const pathWithoutBase = withoutBase(pathname);
  if (pathWithoutBase === '/' || pathWithoutBase === '') {
    return '/index.html';
  }
  return pathWithoutBase;
}
