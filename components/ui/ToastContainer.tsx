
import React from 'react';
import { useUIStore } from '../../store/ui.store';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500
            ${toast.type === 'success' ? 'bg-green-600 text-white' : 
              toast.type === 'error' ? 'bg-red-600 text-white' : 
              'bg-indigo-600 text-white'}
          `}
        >
          <span className="text-xl">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <p className="font-black uppercase text-[10px] tracking-widest">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="ml-4 opacity-50 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
