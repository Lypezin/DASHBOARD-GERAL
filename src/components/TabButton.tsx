import React from 'react';

const TabButton = React.memo(({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 relative flex items-center gap-2 sm:gap-2.5 rounded-xl px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
        active
          ? 'bg-white text-blue-700 shadow-lg ring-2 ring-blue-500/20 dark:bg-slate-800 dark:text-blue-300 dark:ring-blue-600/30 border border-blue-200 dark:border-blue-700'
          : 'bg-white/60 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:ring-slate-600 border border-slate-200/50 dark:border-slate-700/50'
      }`}
    >
      {active && (
        <div className="absolute -bottom-0.5 left-1/2 h-1 w-8 sm:w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      )}
      <span className="text-sm sm:text-base">{icon}</span>
      <span className="hidden xs:inline sm:inline truncate">{label}</span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton;
