import React, { useCallback, useEffect, useState } from 'react';
import { Filters, FilterOption, CurrentUser } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useFiltroBar } from '@/hooks/ui/useFiltroBar';
import { useFiltroBarOptions } from '@/components/dashboard/filters/hooks/useFiltroBarOptions';
import { FilterModeSwitch } from '@/components/dashboard/filters/FilterModeSwitch';
import { FilterPrimarySection } from '@/components/dashboard/filters/FilterPrimarySection';
import { FilterSecondarySection } from '@/components/dashboard/filters/FilterSecondarySection';
import { FilterClearButton } from '@/components/dashboard/filters/FilterClearButton';
import { IS_DEV } from '@/constants/environment';


const FiltroBar = React.memo(function FiltroBar({
  filters, setFilters, anos, semanas, pracas, subPracas, origens, turnos, currentUser, disableWeekLookup = false,
}: {
  filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  anos: number[]; semanas: string[]; pracas: FilterOption[]; subPracas: FilterOption[];
  origens: FilterOption[]; turnos: FilterOption[]; currentUser: CurrentUser | null; disableWeekLookup?: boolean;
}) {
  const {
    handleChange,
    handleClearFilters,
    handleToggleModo,
    hasActiveFilters,
    shouldDisablePracaFilter,
  } = useFiltroBar({ filters, setFilters, currentUser });

  const [showDateRangeFilters, setShowDateRangeFilters] = useState(
    filters?.filtroModo === 'intervalo'
  );

  useEffect(() => {
    setShowDateRangeFilters(filters?.filtroModo === 'intervalo');
  }, [filters?.filtroModo]);

  const handleModeToggle = useCallback(() => {
    setShowDateRangeFilters((current) => {
      const next = !current;

      if (!next && filters?.filtroModo === 'intervalo') {
        handleToggleModo();
      }

      return next;
    });
  }, [filters?.filtroModo, handleToggleModo]);

  const handleClearFiltersClick = useCallback(() => {
    setShowDateRangeFilters(false);
    handleClearFilters();
  }, [handleClearFilters]);

  useEffect(() => {
    if (IS_DEV) {
      safeLog.info('[FiltroBar] Filters recebidos:', {
        filtroModo: filters?.filtroModo,
        filtersKeys: filters ? Object.keys(filters) : 'filters is null/undefined',
      });
    }
  }, [filters]);

  const { anosOptions, semanasOptions } = useFiltroBarOptions(anos, semanas, filters, disableWeekLookup);

  return (
    <div className="relative z-10 w-full space-y-3">
      <div className="grid w-full grid-cols-1 items-end gap-3 xl:grid-cols-[minmax(340px,1.1fr)_minmax(0,1.9fr)]">
        <div className="w-full shrink-0">
          <FilterModeSwitch
            isModoIntervalo={showDateRangeFilters}
            onToggle={handleModeToggle}
          />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(130px,0.75fr)_minmax(220px,1.25fr)]">
          <FilterPrimarySection
            isModoIntervalo={showDateRangeFilters}
            filters={filters}
            setFilters={setFilters}
            anosOptions={anosOptions}
            semanasOptions={semanasOptions}
            handleChange={handleChange}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 items-end gap-2 md:grid-cols-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
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
        <FilterClearButton onClear={handleClearFiltersClick} disabled={!hasActiveFilters} />
      </div>
    </div>
  );
});

FiltroBar.displayName = 'FiltroBar';

export default FiltroBar;
