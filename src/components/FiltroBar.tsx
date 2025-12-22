import React, { useMemo, useEffect } from 'react';
import { getISOWeek } from 'date-fns';
import { Filters, FilterOption, CurrentUser } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useFiltroBar } from '@/hooks/useFiltroBar';
import { FilterModeSwitch } from './dashboard/filters/FilterModeSwitch';
import { FilterPrimarySection } from './dashboard/filters/FilterPrimarySection';
import { FilterSecondarySection } from './dashboard/filters/FilterSecondarySection';

const IS_DEV = process.env.NODE_ENV === 'development';

const FiltroBar = React.memo(function FiltroBar({
  filters,
  setFilters,
  anos,
  semanas,
  pracas,
  subPracas,
  origens,
  turnos,
  currentUser,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  anos: number[];
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  turnos: FilterOption[];
  currentUser: CurrentUser | null;
}) {
  const {
    handleChange,
    handleClearFilters,
    handleToggleModo,
    hasActiveFilters,
    shouldDisablePracaFilter,
  } = useFiltroBar({ filters, setFilters, currentUser });

  useEffect(() => {
    if (IS_DEV) {
      safeLog.info('[FiltroBar] Filters recebidos:', {
        filtroModo: filters?.filtroModo,
        filtersKeys: filters ? Object.keys(filters) : 'filters is null/undefined',
      });
    }
  }, [filters]);

  const anosOptions = useMemo(() => {
    return anos.map((ano) => ({ value: String(ano), label: String(ano) }));
  }, [anos]);


  const semanasOptions = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentWeek = getISOWeek(today);
    const selectedYear = filters?.ano ? parseInt(String(filters.ano), 10) : null;

    return semanas
      .filter(sem => sem && sem !== '' && sem !== 'NaN')
      .filter(sem => {
        // Se o ano selecionado for o atual, não mostrar semanas futuras
        if (selectedYear === currentYear) {
          let weekNumber = sem;
          if (sem.includes('-W')) {
            weekNumber = sem.split('-W')[1];
          }
          const parsed = parseInt(weekNumber, 10);
          return !isNaN(parsed) && parsed <= currentWeek;
        }
        return true;
      })
      .map((sem) => {
        let weekNumber = sem;
        if (sem.includes('-W')) {
          weekNumber = sem.split('-W')[1];
        }
        const parsed = parseInt(weekNumber, 10);
        if (isNaN(parsed)) return null;
        const normalizedWeek = String(parsed);
        return { value: normalizedWeek, label: `Semana ${normalizedWeek}` };
      })
      .filter((opt): opt is { value: string; label: string } => opt !== null);
  }, [semanas, filters?.ano]);

  const isModoIntervalo = filters?.filtroModo === 'intervalo';

  return (
    <div className="relative z-10 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">

        {/* Toggle Mode Swtich - Now Integrated */}
        <div className="mb-0.5 min-w-fit">
          <FilterModeSwitch
            isModoIntervalo={isModoIntervalo}
            onToggle={handleToggleModo}
          />
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block mx-2 self-center" />

        {/* Filters Group */}
        <div className="flex-1 flex flex-wrap items-end gap-3">
          <FilterPrimarySection
            isModoIntervalo={isModoIntervalo}
            filters={filters}
            setFilters={setFilters}
            anosOptions={anosOptions}
            semanasOptions={semanasOptions}
            handleChange={handleChange}
          />

          <FilterSecondarySection
            filters={filters}
            setFilters={setFilters}
            pracas={pracas}
            subPracas={subPracas}
            origens={origens}
            turnos={turnos}
            handleChange={handleChange}
            shouldDisablePracaFilter={shouldDisablePracaFilter}
          />
        </div>

        {/* Clear Button - Compact */}
        {hasActiveFilters && (
          <div className="flex-shrink-0">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-900/20 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 h-[40px]"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Limpar
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

FiltroBar.displayName = 'FiltroBar';

export default FiltroBar;
