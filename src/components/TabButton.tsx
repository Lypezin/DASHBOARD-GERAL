'use client';

import React from 'react';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
}

const TabButton = React.memo(({ label, active, onClick, onFocus, onMouseEnter }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      aria-pressed={active}
      className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 md:px-4 ${active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
    >
      <span className="flex items-center gap-2">
        {label}
      </span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton;
