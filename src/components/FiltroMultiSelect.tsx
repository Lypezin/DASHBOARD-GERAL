import React, { useState, useRef, useEffect } from 'react';

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        wrapperRef.current && 
        !wrapperRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, wrapperRef]);

  // Calcular posição do dropdown usando position fixed para escapar de stacking contexts
  useEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current || !dropdownRef.current) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      
      // Usar position fixed para escapar de qualquer stacking context
      // getBoundingClientRect() retorna coordenadas relativas à viewport (já inclui scroll)
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${buttonRect.bottom + 4}px`;
      dropdown.style.left = `${buttonRect.left}px`;
      dropdown.style.width = `${buttonRect.width}px`;
      dropdown.style.zIndex = '99999';
      dropdown.style.maxHeight = '240px';
    };

    // Usar requestAnimationFrame para garantir que o DOM está atualizado
    const rafId = requestAnimationFrame(() => {
      updatePosition();
    });
    
    // Atualizar posição em caso de scroll ou resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);


  const handleSelect = (value: string) => {
    // Evitar duplicatas: verificar se já existe
    const isAlreadySelected = selected.includes(value);
    
    const newSelected = isAlreadySelected
      ? selected.filter(item => item !== value)
      : [...selected, value];
    
    onSelectionChange(newSelected);
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5" ref={wrapperRef} style={{ position: 'relative', zIndex: isOpen ? 100 : 'auto' }}>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 truncate">{label}</span>
      <div className="relative" style={{ position: 'relative', zIndex: isOpen ? 100 : 'auto' }}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full text-left appearance-none rounded-lg sm:rounded-xl border-2 border-blue-200 bg-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-blue-900 shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-100 dark:hover:border-blue-600 dark:focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-blue-200"
        >
          {selected.length > 0 ? `${selected.length} selecionado(s)` : placeholder}
        </button>
        {isOpen && !disabled && options.length > 0 && (
          <div 
            ref={dropdownRef}
            className="rounded-md bg-white shadow-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
            style={{ 
              position: 'fixed',
              zIndex: 99999,
              maxHeight: '240px'
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
          </div>
        )}
      </div>
    </div>
  );
});

FiltroMultiSelect.displayName = 'FiltroMultiSelect';

export default FiltroMultiSelect;
