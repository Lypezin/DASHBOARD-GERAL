import React, { useMemo, useCallback } from 'react';
import { Filters, FilterOption } from '@/types';
import FiltroSelect from './FiltroSelect';
import FiltroMultiSelect from './FiltroMultiSelect';

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
  currentUser: { is_admin: boolean; assigned_pracas: string[] } | null;
}) {
  const handleChange = useCallback((key: keyof Filters, rawValue: string | null) => {
    setFilters((prev) => {
      let processedValue: any = null;
      if (rawValue && rawValue !== '') {
        if (key === 'ano' || key === 'semana') {
          processedValue = Number(rawValue);
        } else {
          processedValue = rawValue;
        }
      }
      return { ...prev, [key]: processedValue };
    });
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      ano: null, semana: null,
      praca: currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1 ? currentUser.assigned_pracas[0] : null,
      subPraca: null, origem: null, turno: null,
      subPracas: [], origens: [], turnos: [], semanas: [],
    });
  }, [setFilters, currentUser]);

  const hasActiveFilters = useMemo(() => {
    return filters.ano !== null || filters.semana !== null || (filters.semanas && filters.semanas.length > 0) || filters.subPraca !== null || filters.origem !== null || filters.turno !== null || (filters.turnos && filters.turnos.length > 0) ||
      (currentUser?.is_admin && filters.praca !== null);
  }, [filters, currentUser]);

  const shouldDisablePracaFilter = useMemo(() => {
    return Boolean(currentUser && !currentUser.is_admin && currentUser.assigned_pracas.length === 1);
  }, [currentUser]);

  const anosOptions = useMemo(() => {
    return anos.map((ano) => ({ value: String(ano), label: String(ano) }));
  }, [anos]);

  const semanasOptions = useMemo(() => {
    return semanas.map((sem) => {
      const weekNumber = sem.includes('-W') ? sem.split('-W')[1] : sem;
      return { value: weekNumber, label: `Semana ${weekNumber}` };
    });
  }, [semanas]);

  return (
    <div className="space-y-3 sm:space-y-4 relative">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-6" style={{ position: 'relative', zIndex: 60 }}>
        <FiltroSelect label="Ano" value={filters.ano !== null ? String(filters.ano) : ''} options={anosOptions} placeholder="Todos" onChange={(value) => handleChange('ano', value)} />
        <FiltroMultiSelect 
          label="Semana" 
          selected={filters.semanas ? filters.semanas.map(String) : []} 
          options={semanasOptions} 
          placeholder="Todas" 
          onSelectionChange={(values) => setFilters(prev => ({...prev, semanas: values.map(v => parseInt(v))}))} 
        />
        <FiltroSelect label="Praça" value={filters.praca ?? ''} options={pracas} placeholder="Todas" onChange={(value) => handleChange('praca', value)} disabled={shouldDisablePracaFilter} />
        <FiltroMultiSelect label="Sub praça" selected={filters.subPracas || []} options={subPracas} placeholder="Todas" onSelectionChange={(values) => setFilters(prev => ({...prev, subPracas: values}))} />
        <FiltroMultiSelect label="Origem" selected={filters.origens || []} options={origens} placeholder="Todas" onSelectionChange={(values) => setFilters(prev => ({...prev, origens: values}))} />
        <FiltroMultiSelect label="Turno" selected={filters.turnos || []} options={turnos} placeholder="Todos" onSelectionChange={(values) => setFilters(prev => ({...prev, turnos: values}))} />
      </div>
      {hasActiveFilters && (
        <div className="flex justify-center sm:justify-end animate-scale-in">
          <button onClick={handleClearFilters} className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg">
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span>Limpar Filtros</span>
          </button>
        </div>
      )}
    </div>
  );
});

FiltroBar.displayName = 'FiltroBar';

export default FiltroBar;
