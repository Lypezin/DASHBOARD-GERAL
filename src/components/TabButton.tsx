'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
}

const TabButton = React.memo(({ label, active, onClick, onFocus, onMouseEnter }: TabButtonProps) => {
  const shouldReduceMotion = useReducedMotion() ?? true;

  return (
    <button
      onClick={onClick}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      aria-current={active ? 'page' : undefined}
      className={`group relative z-10 flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-[background-color,color,box-shadow,transform] duration-200 md:px-4 ${active
          ? 'text-blue-600 dark:text-blue-300'
          : 'text-slate-600 hover:-translate-y-0.5 hover:text-slate-900 hover:bg-white/55 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/55'
        }`}
    >
      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            key="marketing-subtab-active-background"
            layoutId={shouldReduceMotion ? undefined : 'marketing-subtab-active-background'}
            initial={shouldReduceMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : undefined}
            transition={shouldReduceMotion
              ? { duration: 0.12, ease: 'easeOut' }
              : { type: 'spring', stiffness: 520, damping: 42, mass: 0.75 }}
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-50/65 to-indigo-50/55 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.45)] ring-1 ring-black/5 dark:from-blue-900/20 dark:to-indigo-900/20 dark:ring-white/10"
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 flex items-center gap-2">
        {label}
      </span>
    </button>
  );
});

TabButton.displayName = 'TabButton';

export default TabButton;
