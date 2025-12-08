import React, { useMemo, useEffect } from 'react';
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
    return semanas
      .filter(sem => sem && sem !== '' && sem !== 'NaN')
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
  }, [semanas]);

  const isModoIntervalo = filters?.filtroModo === 'intervalo';

  return (
    <div className="space-y-4 relative z-10">
      <FilterModeSwitch
        isModoIntervalo={isModoIntervalo}
        onToggle={handleToggleModo}
      />

      {/* Filtros em linha horizontal */}
      <div className="flex flex-wrap items-end gap-4">
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

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <div className="flex-shrink-0">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors h-[42px]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <span>Limpar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

FiltroBar.displayName = 'FiltroBar';

export default FiltroBar;
