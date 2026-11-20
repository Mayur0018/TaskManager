import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { id, ...toast };
    setToasts((prev) => [newToast, ...prev].slice(0, TOAST_LIMIT));
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration !== false) {
        const timer = setTimeout(() => removeToast(toast.id), toast.duration || TOAST_REMOVE_DELAY);
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, removeToast]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  return (
    <>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type || 'info'];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-3 w-full max-w-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 animate-in fade-in slide-in-from-right-2 duration-200"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? 'bg-success-100 text-success-600' :
                toast.type === 'error' ? 'bg-danger-100 text-danger-600' :
                'bg-info-100 text-info-600'
              }`}>
              <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50">{toast.title}</h4>
                {toast.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-0 hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
              >
                <span className="sr-only">Close</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function useToast() {
  // This is a simplified version; in production you'd use a proper context
  return { addToast: () => {}, removeToast: () => {} };
}