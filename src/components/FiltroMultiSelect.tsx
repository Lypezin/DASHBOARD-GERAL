import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

type FilterOption = {
  value: string;
  label: string;
};

const FiltroMultiSelect = React.memo(({ label, placeholder, options, selected, onSelectionChange, disabled = false }: {
  label: string;
  placeholder: string;
  options: FilterOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);


  const handleSelect = (value: string) => {
    // Evitar duplicatas: verificar se já existe
    const isAlreadySelected = selected.includes(value);
    
    const newSelected = isAlreadySelected
      ? selected.filter(item => item !== value)
      : [...selected, value];
    
    onSelectionChange(newSelected);
  };

  const dropdownContent = isOpen && !disabled && options.length > 0 && typeof window !== 'undefined' ? createPortal(
    <div 
      ref={dropdownRef}
      className="fixed rounded-md bg-white shadow-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 z-[9999]"
      style={{ 
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 9999
      }}
    >
      <ul className="max-h-60 overflow-auto p-1">
        {options.map((option) => (
          <li
            key={option.value}
            className="p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md"
            onClick={() => handleSelect(option.value)}
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              readOnly
              className="mr-2"
            />
            {option.label}
          </li>
        ))}
      </ul>
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 relative" ref={wrapperRef}>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 truncate">{label}</span>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full text-left appearance-none rounded-lg sm:rounded-xl border-2 border-blue-200 bg-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-blue-900 shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-100 dark:hover:border-blue-600 dark:focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-blue-200"
        >
          {selected.length > 0 ? `${selected.length} selecionado(s)` : placeholder}
        </button>
      </div>
      {dropdownContent}
    </div>
  );
});

FiltroMultiSelect.displayName = 'FiltroMultiSelect';

export default FiltroMultiSelect;
