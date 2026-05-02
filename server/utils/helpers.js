export const normalizeString = (value) => typeof value === 'string' ? value.trim().toLowerCase() : value;

export const normalizeInteger = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};
