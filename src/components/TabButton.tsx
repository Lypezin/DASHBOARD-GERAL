'use client';

import React from 'react';

const TabButton = React.memo(({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative z-10 flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-[background-color,color,box-shadow,transform] duration-200 md:px-4 ${active
          ? 'bg-white text-blue-600 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.45)] ring-1 ring-black/5 dark:bg-slate-800 dark:text-blue-300 dark:ring-white/10'
          : 'text-slate-600 hover:-translate-y-0.5 hover:text-slate-900 hover:bg-white/55 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/55'
        }`}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/65 to-indigo-50/55 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-100 transition-opacity" />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {label}
      </span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton;
