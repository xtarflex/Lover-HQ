import React from 'react';
import { useAppContext } from '../contexts/AppContext';

export function TopBar() {
  const { user, partner, presence } = useAppContext();

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold text-gray-800">OurSpace</h1>
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium text-gray-700">{user.name || user.email}</div>
            <div
              className={`w-3 h-3 rounded-full ${presence.user === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}
            />
          </div>
        )}
        {partner && (
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium text-gray-700">{partner.name || partner.email}</div>
            <div
              className={`w-3 h-3 rounded-full ${presence.partner === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}
            />
          </div>
        )}
      </div>
    </header>
  );
}
