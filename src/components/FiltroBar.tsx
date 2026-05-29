import React, { useCallback, useEffect, useState } from 'react';
import { Filters, FilterOption, CurrentUser } from '@/types';
import { safeLog } from '@/lib/errorHandler';
import { useFiltroBar } from '@/hooks/ui/useFiltroBar';
import { useFiltroBarOptions } from './dashboard/filters/hooks/useFiltroBarOptions';
import { FilterModeSwitch } from './dashboard/filters/FilterModeSwitch';
import { FilterPrimarySection } from './dashboard/filters/FilterPrimarySection';
import { FilterSecondarySection } from './dashboard/filters/FilterSecondarySection';
import { FilterClearButton } from './dashboard/filters/FilterClearButton';

const IS_DEV = process.env.NODE_ENV === 'development';

const FiltroBar = React.memo(function FiltroBar({
  filters, setFilters, anos, semanas, pracas, subPracas, origens, turnos, currentUser,
}: {
  filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  anos: number[]; semanas: string[]; pracas: FilterOption[]; subPracas: FilterOption[];
  origens: FilterOption[]; turnos: FilterOption[]; currentUser: CurrentUser | null;
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

  const { anosOptions, semanasOptions } = useFiltroBarOptions(anos, semanas, filters);

  return (
    <div className="relative z-10 font-sans w-full">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end w-full">
        {/* Toggle Mode Switch - Alinhamento natural com label embutido */}
        <div className="min-w-fit shrink-0 w-full sm:w-auto">
          <FilterModeSwitch
            isModoIntervalo={showDateRangeFilters}
            onToggle={handleModeToggle}
          />
        </div>

        <div className="hidden xl:block mx-1 h-[38px] w-px bg-border/80 shrink-0 self-end mb-0.5" />

        {/* Filters Group - CSS Grid Simétrico e Responsivo */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 min-w-0 flex-1">
          <FilterPrimarySection
            isModoIntervalo={showDateRangeFilters}
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

        {/* Clear Button - Alinhamento natural com label embutido */}
        {hasActiveFilters && (
          <div className="shrink-0 w-full sm:w-auto">
            <FilterClearButton onClear={handleClearFiltersClick} />
          </div>
        )}
      </div>
    </div>
  );
});

FiltroBar.displayName = 'FiltroBar';

export default FiltroBar;
