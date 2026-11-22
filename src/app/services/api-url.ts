export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
    return `https://asadero-con-afan.onrender.com${normalizedPath}`;
  }

  return normalizedPath;
}
