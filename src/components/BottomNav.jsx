import React from 'react';
import { NavLink } from 'react-router-dom';
import { FridgeIcon, Music, Gamepad2, ClipboardList, LoverHQLogo } from '../lib/icons';
import { ICON_SIZES } from '../lib/constants';

export function BottomNav() {
  const navItems = [
    { name: 'Fridge', path: '/fridge', icon: FridgeIcon },
    { name: 'Music', path: '/music', icon: Music },
    { name: 'HOME', path: '/home', isHome: true },
    { name: 'Games', path: '/games', icon: Gamepad2 },
    { name: 'Board', path: '/board', icon: ClipboardList },
  ];

  return (
    <nav className="bg-brand-surface/90 backdrop-blur-lg border-t border-gray-800 fixed bottom-0 w-full h-20 z-50 px-4">
      <ul className="flex items-center justify-around h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          if (item.isHome) {
            return (
              <li key={item.path} className="flex-1 relative flex justify-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `absolute -top-6 w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center border-4 border-pink-50 dark:border-brand-slate shadow-lg transition-transform duration-300 ${
                      isActive
                        ? 'scale-110 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                        : 'hover:scale-105'
                    }`
                  }
                >
                  <LoverHQLogo className="text-white w-7 h-7" />
                </NavLink>
                <span className="absolute bottom-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {item.name}
                </span>
              </li>
            );
          }

          const IconComponent = item.icon;
          return (
            <li key={item.path} className="flex-1 flex justify-center">
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
                <div className="mb-1 flex items-center justify-center h-8">
                  <IconComponent size={ICON_SIZES.md} className="stroke-current" />
                </div>
                <span className="opacity-80">{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
