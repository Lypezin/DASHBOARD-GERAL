import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterOption } from './FiltroSelect';

interface FiltroMultiSelectDropdownProps {
  isOpen: boolean;
  disabled?: boolean;
  options: FilterOption[];
  selected: string[];
  onSelect: (value: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

export const FiltroMultiSelectDropdown: React.FC<FiltroMultiSelectDropdownProps> = ({
  isOpen, disabled, options, selected, onSelect, dropdownRef
}) => {
  return (
    <AnimatePresence>
      {isOpen && !disabled && options.length > 0 && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute top-full left-0 w-full mt-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 z-[9999] overflow-hidden"
        >
          <ul className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <motion.li
                  key={option.value}
                  whileHover={{ x: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  className={cn(
                    "p-2.5 cursor-pointer rounded-lg flex items-center transition-colors mb-0.5 last:mb-0",
                    isSelected ? "bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                  onClick={() => onSelect(option.value)}
                >
                  <div className="flex items-center flex-1">
                    <div className={cn(
                      "mr-3 flex h-4 w-4 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-transparent"
                    )}>
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
