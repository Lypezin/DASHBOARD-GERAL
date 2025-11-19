import React from 'react';

const TabButton = React.memo(({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`group shrink-0 relative flex items-center justify-center gap-2 rounded-xl px-5 md:px-6 py-3 text-sm font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
        active
          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl ring-2 ring-blue-400/50 transform scale-105 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500'
          : 'bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-lg hover:ring-1 hover:ring-blue-300/40 hover:scale-105 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:ring-blue-600/40 border-0'
      }`}
    >
      {active && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-indigo-400/30 to-purple-400/30 animate-pulse rounded-xl"></div>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl blur opacity-50"></div>
        </>
      )}
      <span className="relative z-10 truncate">{label}</span>
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-indigo-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:via-indigo-600/10 group-hover:to-purple-600/10 transition-all duration-300 rounded-xl"></div>
      )}
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton;
