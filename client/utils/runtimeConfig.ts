export const apiBaseUrl = import.meta.env.DEV ? 'http://localhost:5000' : 'http://13.53.123.178:5000';
export const apiBasePath = `${apiBaseUrl}/api`;

export const toAssetUrl = (path: string) => {
  if (!path) return apiBaseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
