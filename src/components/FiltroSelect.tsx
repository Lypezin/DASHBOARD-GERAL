import React, { useState, useRef, useCallback } from 'react';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterOption = {
  value: string;
  label: string;
};

const FiltroSelect = React.memo(({ label, placeholder, options, value, onChange, disabled = false }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const refsToCheck = useRef([wrapperRef, dropdownRef]);
  useClickOutside(refsToCheck.current, closeDropdown);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (selectedValue: string | null) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 relative group" ref={wrapperRef}>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 truncate pl-1">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full text-left appearance-none rounded-xl border border-slate-200/60 dark:border-slate-700/60",
            "bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-3 py-2.5 pr-8 text-sm font-medium",
            "text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300",
            "hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-blue-400/50 hover:shadow-md",
            isOpen ? "ring-2 ring-blue-500/40 border-blue-500" : "hover:ring-2 hover:ring-blue-500/20",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className="block truncate">
            {selectedOption ? (
              <span className="text-blue-600 dark:text-blue-400">{selectedOption.label}</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-normal">{placeholder}</span>
            )}
          </span>
        </button>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        >
          <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </motion.div>

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors bg-white/50 dark:bg-slate-800/50 rounded-full p-0.5 z-10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

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
              <motion.li
                whileHover={{ x: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                className={cn(
                  "p-2.5 cursor-pointer rounded-lg flex items-center transition-colors mb-0.5",
                  !value ? "bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                )}
                onClick={() => handleSelect(null)}
              >
                <div className="flex items-center flex-1">
                  <div className={cn(
                    "mr-3 flex h-4 w-4 items-center justify-center rounded border transition-colors",
                    !value
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-300 dark:border-slate-600 bg-transparent"
                  )}>
                    {!value && <Check className="h-3 w-3" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-medium">{placeholder || 'Todos'}</span>
                </div>
              </motion.li>

              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <motion.li
                    key={option.value}
                    whileHover={{ x: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                    className={cn(
                      "p-2.5 cursor-pointer rounded-lg flex items-center transition-colors mb-0.5 last:mb-0",
                      isSelected ? "bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                    onClick={() => handleSelect(option.value)}
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
    </div>
  );
});

FiltroSelect.displayName = 'FiltroSelect';

export default FiltroSelect;
