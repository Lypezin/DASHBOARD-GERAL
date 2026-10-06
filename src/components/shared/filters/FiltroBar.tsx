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
import { getDimensionFilterSupport } from '@/utils/filters/dimensionFilterSupport';


const FiltroBar = React.memo(function FiltroBar({
  filters, setFilters, anos, semanas, pracas, subPracas, origens, turnos, currentUser,
  activeTab, optionsLoading = false, optionsError = null,
}: {
  filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  anos: number[]; semanas: string[]; pracas: FilterOption[]; subPracas: FilterOption[];
  origens: FilterOption[]; turnos: FilterOption[]; currentUser: CurrentUser | null;
  activeTab: string;
  optionsLoading?: boolean; optionsError?: string | null;
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

  const { anosOptions, semanasOptions, loadingSemanas, errorSemanas, retrySemanas } = useFiltroBarOptions(anos, semanas, filters);
  const dimensionSupport = getDimensionFilterSupport(activeTab);
  const hasSubPracaFilter = Boolean(filters.subPracas?.length || filters.subPraca);
  const hasOrigemFilter = Boolean(filters.origens?.length || filters.origem);
  const unsupportedActiveFilters = [
    !dimensionSupport.subPraca && hasSubPracaFilter ? 'Sub praça' : null,
    !dimensionSupport.origem && hasOrigemFilter ? 'Origem' : null,
    !dimensionSupport.turno && (filters.turnos?.length || filters.turno) ? 'Turno' : null,
  ].filter((label): label is string => Boolean(label));
  const hasUnsupportedSubPracaOriginCombination = dimensionSupport.subPraca
    && dimensionSupport.origem
    && hasSubPracaFilter
    && hasOrigemFilter;

  const clearUnsupportedDimensionFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      ...(dimensionSupport.subPraca ? {} : { subPraca: null, subPracas: [] }),
      ...(dimensionSupport.origem ? {} : { origem: null, origens: [] }),
      ...(dimensionSupport.turno ? {} : { turno: null, turnos: [] }),
    }));
  }, [dimensionSupport, setFilters]);

  const clearSubPracaFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, subPraca: null, subPracas: [] }));
  }, [setFilters]);

  const clearOrigemFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, origem: null, origens: [] }));
  }, [setFilters]);

  return (
    <div className="relative z-10 w-full" data-filter-view={activeTab}>
      <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-end">
        <div className="w-full shrink-0 sm:w-auto">
          <FilterModeSwitch
            isModoIntervalo={showDateRangeFilters}
            onToggle={handleModeToggle}
            appearance={activeTab === 'entregadores' ? 'quiet' : 'default'}
          />
        </div>

        <div className="hidden h-10 w-px shrink-0 self-end bg-slate-200/80 dark:bg-slate-800/80 xl:block" />

        <div className={`grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 ${
          showDateRangeFilters ? "xl:grid-cols-7" : "xl:grid-cols-6"
        }`}>
          <FilterPrimarySection
            isModoIntervalo={showDateRangeFilters}
            filters={filters}
            setFilters={setFilters}
            anosOptions={anosOptions}
            semanasOptions={semanasOptions}
            loadingSemanas={loadingSemanas}
            errorSemanas={errorSemanas}
            onRetrySemanas={retrySemanas}
            handleChange={handleChange}
            appearance={activeTab === 'entregadores' ? 'quiet' : 'default'}
          />

          <FilterSecondarySection
            filters={filters}
            setFilters={setFilters}
            pracas={pracas}
            subPracas={subPracas}
            origens={origens}
            turnos={turnos}
            dimensionSupport={dimensionSupport}
            handleChange={handleChange}
            shouldDisablePracaFilter={shouldDisablePracaFilter}
            optionsLoading={optionsLoading}
            optionsError={optionsError}
            appearance={activeTab === 'entregadores' ? 'quiet' : 'default'}
          />
        </div>

        {hasActiveFilters && (
          <div className="w-full shrink-0 sm:w-auto">
            <FilterClearButton
              onClear={handleClearFiltersClick}
              appearance={activeTab === 'entregadores' ? 'quiet' : 'default'}
            />
          </div>
        )}
      </div>
      {unsupportedActiveFilters.length > 0 ? (
        <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
          <span>
            Os filtros {unsupportedActiveFilters.join(', ')} estão selecionados, mas esta guia não os aplica.
          </span>
          <button
            type="button"
            onClick={clearUnsupportedDimensionFilters}
            className="font-bold underline underline-offset-2 hover:no-underline"
          >
            Limpar não aplicados
          </button>
        </div>
      ) : null}
      {hasUnsupportedSubPracaOriginCombination ? (
        <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
          <span className="min-w-0 flex-1">
            Sub praça e origem não têm cruzamento nos dados atuais. Com os dois filtros ativos, a consulta fica vazia. Escolha qual manter:
          </span>
          <div className="flex shrink-0 flex-wrap gap-3">
            <button type="button" onClick={clearOrigemFilter} className="font-bold underline underline-offset-2 hover:no-underline">
              Manter sub praça
            </button>
            <button type="button" onClick={clearSubPracaFilter} className="font-bold underline underline-offset-2 hover:no-underline">
              Manter origem
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
});

FiltroBar.displayName = 'FiltroBar';

export default FiltroBar;
