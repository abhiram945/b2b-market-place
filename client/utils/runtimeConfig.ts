const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedApiUrl = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : 'http://13.53.123.178:5000');

export const apiBaseUrl = normalizedApiUrl;
export const apiBasePath = `${normalizedApiUrl}/api`;

export const toAssetUrl = (path: string) => {
  if (!path) return normalizedApiUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${normalizedApiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
