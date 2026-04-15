export const apiBaseUrl = import.meta.env.DEV ? 'http://localhost:5000' : 'https://api.marketmea.com';
export const apiBasePath = `${apiBaseUrl}/api`;

export const toAssetUrl = (path: string) => {
  if (!path) return apiBaseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
