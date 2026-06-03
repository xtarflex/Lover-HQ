/**
 * @file SettingsSidebar.jsx
 * @description Left-side navigation panel for the Settings page.
 * Displays a searchable list of setting categories.
 */

import React from 'react';
import { LogOut, ChevronRight } from 'lucide-react';

/**
 * @param {{
 *   categories: Array<{id: string, label: string, desc: string, icon: React.ElementType}>,
 *   filteredCategories: Array<{id: string, label: string, desc: string, icon: React.ElementType}>,
 *   activeCategory: string,
 *   isMobileDetailView: boolean,
 *   onSelectCategory: Function,
 *   onLogout: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function SettingsSidebar({
  filteredCategories,
  activeCategory,
  isMobileDetailView,
  onSelectCategory,
  onLogout,
}) {
  return (
    <section
      className={`col-span-1 md:col-span-4 bg-surface/60 backdrop-blur-xl md:rounded-2xl border-r md:border border-surface-border flex flex-col p-4 space-y-1 transition-transform duration-300 z-10 ${isMobileDetailView ? '-translate-x-full absolute w-full h-full md:relative md:translate-x-0' : 'translate-x-0 relative'}`}
    >
      <div className="px-2 py-1.5 mb-2">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
          System Settings
        </span>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${isActive ? 'bg-primary/10 border border-primary/20 text-primary font-bold' : 'hover:bg-surface-border/30 text-text-main font-medium border border-transparent'}`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`p-2 rounded-lg ${isActive ? 'bg-primary/20 text-primary' : 'bg-surface-border/50 text-text-muted'}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-sm">{cat.label}</span>
                  <span
                    className={`block text-xs mt-0.5 ${isActive ? 'text-primary/70' : 'text-text-muted font-normal'}`}
                  >
                    {cat.desc}
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`h-5 w-5 md:hidden ${isActive ? 'text-primary' : 'text-text-muted'}`}
              />
            </button>
          );
        })}
      </nav>

      <div className="border-t border-surface-border pt-4 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition text-sm border border-rose-500/20"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </section>
  );
}
