export interface AlertItem {
  field?: string;
  message: string;
}

export interface AlertInput {
  id?: string;
  variant?: 'error' | 'success' | 'info';
  title: string;
  message?: string;
  items?: AlertItem[];
  durationMs?: number;
}

export interface AlertEntry extends AlertInput {
  id: string;
  variant: 'error' | 'success' | 'info';
  durationMs: number;
}
