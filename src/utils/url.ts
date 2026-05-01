const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path = '/'): string {
  if (/^https?:\/\//.test(path) || path.startsWith('mailto:')) {
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
