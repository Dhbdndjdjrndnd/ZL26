
import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { AppNotification } from '../App';

interface NotificationToastProps {
  notification: AppNotification;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const getStyle = () => {
    switch (notification.type) {
      case 'error': return 'bg-red-600 text-white shadow-red-200';
      case 'success': return 'bg-emerald-600 text-white shadow-emerald-200';
      default: return 'bg-slate-800 text-white shadow-slate-200';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'error': return <AlertCircle size={18} />;
      case 'success': return <CheckCircle2 size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl animate-in slide-in-from-right-4 fade-in duration-300 ${getStyle()}`}>
      <div className="shrink-0">{getIcon()}</div>
      <p className="text-xs font-bold leading-tight">{notification.message}</p>
    </div>
  );
};
