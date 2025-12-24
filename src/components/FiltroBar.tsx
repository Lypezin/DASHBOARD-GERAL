import React, { useMemo, useEffect } from 'react';
import { getISOWeek } from 'date-fns';
import { Filters, FilterOption, CurrentUser } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useFiltroBar } from '@/hooks/useFiltroBar';
import { useFiltroBarOptions } from './dashboard/filters/hooks/useFiltroBarOptions';
import { FilterModeSwitch } from './dashboard/filters/FilterModeSwitch';
import { FilterPrimarySection } from './dashboard/filters/FilterPrimarySection';
import { FilterSecondarySection } from './dashboard/filters/FilterSecondarySection';
import { FilterClearButton } from './dashboard/filters/FilterClearButton';

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

  const { anosOptions, semanasOptions } = useFiltroBarOptions(anos, semanas, filters);

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
          <FilterClearButton onClear={handleClearFilters} />
        )}
      </div>
    </div>
  );
});

FiltroBar.displayName = 'FiltroBar';

export default FiltroBar;
