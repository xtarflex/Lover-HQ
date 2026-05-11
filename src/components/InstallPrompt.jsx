import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Don't show immediately - wait for user to be engaged
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed');
        if (!hasSeenPrompt) {
          setShowPrompt(true);
        }
      }, 10000); // Show after 10 seconds
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-amber-500" />
          </div>

          <div className="flex-1">
            <h3 className="text-slate-100 font-semibold text-sm">Install Lover-HQ</h3>
            <p className="text-slate-400 text-xs mt-1">Add to your home screen for quick access</p>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
