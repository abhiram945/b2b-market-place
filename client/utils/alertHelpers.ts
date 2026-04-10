import { FieldErrors } from 'react-hook-form';
import { AlertItem } from '../types/alerts';

const toLabel = (field: string) =>
  field
    .replace(/\.(\d+)\./g, ' $1 ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formErrorsToAlertItems = <T extends Record<string, any>>(errors: FieldErrors<T>): AlertItem[] => {
  const items: AlertItem[] = [];

  const visit = (value: any, path = '') => {
    if (!value) return;

    if (typeof value.message === 'string') {
      items.push({
        field: toLabel(path),
        message: value.message,
      });
    }

    Object.entries(value).forEach(([key, child]) => {
      if (key === 'message' || key === 'type' || key === 'ref') return;
      visit(child, path ? `${path}.${key}` : key);
    });
  };

  visit(errors);
  return items;
};

export const apiErrorsToAlertItems = (error: any): AlertItem[] => {
  if (typeof error === 'string') {
    return [{ message: error }];
  }

  const fieldErrors = error?.response?.data?.errors;
  if (Array.isArray(fieldErrors)) {
    return fieldErrors.map((item: { msg: string; path?: string; param?: string }) => ({
      field: toLabel(item.path || item.param || 'field'),
      message: item.msg,
    }));
  }

  const message = error?.response?.data?.message || error?.message;
  return message ? [{ message }] : [];
};
