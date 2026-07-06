import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Heart, X, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Reusable notification toast component rendered outside the regular DOM hierarchy using a portal.
 * Slides in from the top of the viewport.
 *
 * @param {Object} props - Component props.
 * @param {string} props.message - The message to display.
 * @param {'error'|'success'|'info'} [props.type='error'] - The type of notification.
 * @param {Function} props.onClose - Callback triggered when closed.
 * @param {number} [props.duration=5000] - Auto-close duration in milliseconds.
 * @returns {React.ReactPortal|null} The notification portal.
 */
export function Notification({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/10 border-green-500/30 text-green-400 shadow-green-500/5',
          icon: <CheckCircle className="w-5.5 h-5.5 text-green-400 shrink-0" />,
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/5',
          icon: <AlertCircle className="w-5.5 h-5.5 text-blue-400 shrink-0" />,
        };
      case 'error':
      default:
        return {
          bg: 'bg-error-bg/10 border-error-bg/30 text-error-bg shadow-error-bg/5',
          icon: <Heart className="w-5.5 h-5.5 text-error-bg shrink-0 fill-current" />,
        };
    }
  };

  const config = getStyles();

  return createPortal(
    <div className="fixed top-4 left-4 right-4 z-[9999] pointer-events-none flex justify-center">
      <div
        className={`w-full max-w-sm pointer-events-auto backdrop-blur-xl border p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-slide-down-fade ${config.bg}`}
      >
        <div className="flex items-center gap-3">
          {config.icon}
          <span className="font-handwriting text-lg leading-tight">{message}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>,
    document.body
  );
}
