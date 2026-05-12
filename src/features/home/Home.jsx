import React from 'react';

export default function Home() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8 bg-white/60 dark:bg-brand-surface/40 backdrop-blur-2xl border-2 border-pink-100 dark:border-white/5 rounded-3xl">
        <h1 className="text-3xl font-heading font-bold text-slate-800 dark:text-slate-200 mb-4">
          Home Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-handwriting text-xl">
          Dashboard coming soon...
        </p>
      </div>
    </div>
  );
}
