import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Types ---
type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

// --- Provider Component ---
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-dismiss
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

// --- Individual Toast Item ---
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        error: <AlertCircle className="h-5 w-5 text-[#E2000F]" />,
        info: <Info className="h-5 w-5 text-slate-600" />
    };

    const bgStyles = {
        success: "bg-white border-emerald-200 shadow-lg shadow-emerald-500/10",
        error: "bg-white border-red-200 shadow-lg shadow-red-500/10",
        info: "bg-white border-slate-200 shadow-lg shadow-slate-200/50"
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
                "pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-xl border flex items-start gap-3",
                bgStyles[toast.type]
            )}
        >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 leading-relaxed">{toast.message}</p>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
};
