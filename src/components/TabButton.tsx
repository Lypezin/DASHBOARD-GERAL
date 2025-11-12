import React from 'react';

const TabButton = React.memo(({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`group shrink-0 relative flex items-center gap-1.5 sm:gap-2 md:gap-2.5 rounded-lg sm:rounded-xl px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-3.5 text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl ring-2 ring-blue-500/50 transform scale-105 dark:from-blue-500 dark:to-indigo-500'
          : 'bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-lg hover:ring-2 hover:ring-blue-300/50 hover:scale-105 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:ring-blue-600/50 border border-slate-200/50 dark:border-slate-700/50'
      }`}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 animate-pulse rounded-xl"></div>
      )}
      <span className="relative z-10 text-base sm:text-lg md:text-xl transform transition-transform group-hover:scale-110">{icon}</span>
      <span className="relative z-10 hidden sm:inline truncate">{label}</span>
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-all duration-300 rounded-xl"></div>
      )}
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton;
