import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  ToastContext,
  type ToastItem,
  type ToastVariant,
} from './toast-context';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: ToastItem = { id, duration: 4000, ...t };
    setToasts((prev) => [item, ...prev]);

    if (item.duration && item.duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), item.duration);
    }

    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex max-w-xs flex-col gap-3">
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const colors: Record<ToastVariant, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div
      role="status"
      className={`w-full animate-fade-in rounded-lg border p-3 shadow-sm ${colors[toast.variant ?? 'info']}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {toast.title && <div className="font-semibold">{toast.title}</div>}
          {toast.description && <div className="mt-1 text-sm">{toast.description}</div>}
        </div>
        <button onClick={onClose} aria-label="Close toast" className="ml-2 text-sm opacity-80">
          ✕
        </button>
      </div>
    </div>
  );
}