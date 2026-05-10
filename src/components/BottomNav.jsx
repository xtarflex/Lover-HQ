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
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full h-16 z-10">
      <ul className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => (
          <li key={item.path} className="flex-1">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
