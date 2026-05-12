import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-amber-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-amber-800">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-300 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-100 text-sm font-medium">You&apos;re offline</p>
            <p className="text-amber-300 text-xs mt-0.5">Some features may be limited</p>
          </div>
        </div>
      </div>
    </div>
  );
}
