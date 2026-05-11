import React from 'react';
import { NavLink } from 'react-router-dom';

export function BottomNav() {
  const navItems = [
    { name: 'Fridge', path: '/fridge', icon: '🧊' },
    { name: 'Music', path: '/music', icon: '🎵' },
    { name: 'Games', path: '/games', icon: '🎮' },
    { name: 'Board', path: '/board', icon: '📋' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <nav className="bg-brand-surface/90 backdrop-blur-lg border-t border-gray-800 fixed bottom-0 w-full h-20 z-50 px-4">
      <ul className="flex items-center justify-around h-full max-w-lg mx-auto">
        {navItems.map((item) => (
          <li key={item.path} className="flex-1">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  isActive 
                    ? 'text-primary scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                    : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="opacity-80">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
