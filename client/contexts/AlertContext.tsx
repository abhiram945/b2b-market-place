import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { X } from '../components/icons';
import { AlertEntry, AlertInput } from '../types/alerts';

interface AlertContextValue {
  showAlert: (input: AlertInput) => void;
  removeAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const variantStyles: Record<AlertEntry['variant'], { shell: string; line: string; text: string; progress: string }> = {
  error: {
    shell: 'border-red-200 bg-white',
    line: 'bg-red-600',
    text: 'text-red-700',
    progress: 'bg-red-500',
  },
  success: {
    shell: 'border-emerald-200 bg-white',
    line: 'bg-emerald-500',
    text: 'text-emerald-700',
    progress: 'bg-emerald-400',
  },
  info: {
    shell: 'border-zinc-200 bg-white',
    line: 'bg-zinc-900',
    text: 'text-zinc-700',
    progress: 'bg-zinc-500',
  },
};

const AlertCard: React.FC<{ alert: AlertEntry; onClose: (id: string) => void }> = ({ alert, onClose }) => {
  const styles = variantStyles[alert.variant];

  return (
    <div className={`relative overflow-hidden rounded-2xl border shadow-2xl w-fit max-w-[min(90vw,42rem)] ${styles.shell}`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${styles.line}`}></div>
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start gap-4">
          <div className="min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${styles.text}`}>{alert.title}</p>
            {alert.message ? (
              <p className="mt-2 text-sm font-bold text-zinc-700 whitespace-pre-wrap">{alert.message}</p>
            ) : null}
            {alert.items && alert.items.length > 0 ? (
              <div className="mt-2 space-y-1">
                {alert.items.map((item, index) => (
                  <p key={`${alert.id}-${index}`} className="text-sm font-medium text-zinc-700 whitespace-pre-wrap">
                    <span className="font-black text-zinc-900">{item.field ? `${item.field}: ` : ''}</span>
                    {item.message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onClose(alert.id)}
            className="shrink-0 rounded-full border border-zinc-200 p-1.5 text-zinc-400 transition-colors hover:text-brand-red"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="h-1 w-full bg-zinc-100">
        <div
          className={`h-full origin-left ${styles.progress}`}
          style={{
            animation: `alert-progress ${alert.durationMs}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback((input: AlertInput) => {
    const id = input.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: AlertEntry = {
      id,
      variant: input.variant || 'info',
      durationMs: input.durationMs || 5000,
      ...input,
    };

    setAlerts((current) => [...current, entry]);
    window.setTimeout(() => {
      setAlerts((current) => current.filter((alert) => alert.id !== id));
    }, entry.durationMs);
  }, []);

  const value = useMemo(() => ({ showAlert, removeAlert }), [showAlert, removeAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex max-w-[90vw] flex-col gap-3 items-end">
        {alerts.map((alert) => (
          <div key={alert.id} className="pointer-events-auto">
            <AlertCard alert={alert} onClose={removeAlert} />
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};
