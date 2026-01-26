import React from 'react';

const TabButton = React.memo(({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`group shrink-0 relative flex items-center justify-center gap-2 rounded-xl px-4 md:px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden z-10 ${active
          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5 scale-[1.02] dark:bg-slate-700 dark:text-blue-400 dark:ring-white/10'
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/50'
        }`}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-100 transition-opacity" />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {label}
      </span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton;
