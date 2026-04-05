export const toLowerTrim = (value?: string | null) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const toLowerTrimOptional = (value?: string | null) => {
  const normalized = toLowerTrim(value);
  return normalized || undefined;
};
