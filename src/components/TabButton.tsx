import React from 'react';

const TabButton = React.memo(({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`group shrink-0 relative flex items-center justify-center gap-2 rounded-lg sm:rounded-xl px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap overflow-hidden ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-500/50 transform scale-105 dark:from-blue-500 dark:to-indigo-500'
          : 'bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-blue-300/30 hover:scale-105 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:ring-blue-600/30 border border-slate-200/50 dark:border-slate-700/50'
      }`}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 animate-pulse rounded-xl"></div>
      )}
      <span className="relative z-10 truncate">{label}</span>
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-all duration-300 rounded-xl"></div>
      )}
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton;
