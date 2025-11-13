import React, { useMemo, useCallback, useEffect } from 'react';
import { Filters, FilterOption } from '@/types';
import FiltroSelect from './FiltroSelect';
import FiltroMultiSelect from './FiltroMultiSelect';
import FiltroDateRange from './FiltroDateRange';
import { safeLog } from '@/lib/errorHandler';

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
  currentUser: { is_admin: boolean; assigned_pracas: string[] } | null;
}) {
  // Log para debug (apenas em desenvolvimento)
  useEffect(() => {
    if (IS_DEV) {
      safeLog.info('[FiltroBar] Filters recebidos:', {
        filtroModo: filters?.filtroModo,
        dataInicial: filters?.dataInicial,
        dataFinal: filters?.dataFinal,
        ano: filters?.ano,
        semana: filters?.semana,
        hasFiltroModo: 'filtroModo' in (filters || {}),
        filtersKeys: filters ? Object.keys(filters) : 'filters is null/undefined',
      });
    }
  }, [filters]);
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
      filtroModo: 'ano_semana',
      dataInicial: null,
      dataFinal: null,
    });
  }, [setFilters, currentUser]);

  const handleToggleModo = useCallback(() => {
    if (IS_DEV) {
      safeLog.info('[FiltroBar] handleToggleModo chamado');
    }
    try {
      setFilters((prev) => {
        if (!prev) {
          if (IS_DEV) {
            safeLog.warn('[FiltroBar] handleToggleModo: prev é null/undefined');
          }
          return prev;
        }
        const novoModo: 'ano_semana' | 'intervalo' = (prev.filtroModo ?? 'ano_semana') === 'ano_semana' ? 'intervalo' : 'ano_semana';
        if (IS_DEV) {
          safeLog.info('[FiltroBar] Trocando modo:', {
            modoAtual: prev.filtroModo,
            novoModo,
          });
        }
        const newFilters: Filters = {
          ...prev,
          filtroModo: novoModo,
          // Limpar filtros do modo anterior
          ano: novoModo === 'intervalo' ? null : prev.ano,
          semana: novoModo === 'intervalo' ? null : prev.semana,
          semanas: novoModo === 'intervalo' ? [] : prev.semanas ?? [],
          dataInicial: novoModo === 'ano_semana' ? null : prev.dataInicial ?? null,
          dataFinal: novoModo === 'ano_semana' ? null : prev.dataFinal ?? null,
        };
        if (IS_DEV) {
          safeLog.info('[FiltroBar] Novos filters após toggle:', newFilters);
        }
        return newFilters;
      });
    } catch (error) {
      safeLog.error('[FiltroBar] Erro em handleToggleModo:', error);
    }
  }, [setFilters]);

  const hasActiveFilters = useMemo(() => {
    if (!filters) return false;
    if (filters.filtroModo === 'intervalo') {
      return filters.dataInicial !== null || filters.dataFinal !== null || filters.subPraca !== null || filters.origem !== null || filters.turno !== null || (filters.turnos && filters.turnos.length > 0) ||
        (currentUser?.is_admin && filters.praca !== null);
    } else {
      return filters.ano !== null || filters.semana !== null || (filters.semanas && filters.semanas.length > 0) || filters.subPraca !== null || filters.origem !== null || filters.turno !== null || (filters.turnos && filters.turnos.length > 0) ||
        (currentUser?.is_admin && filters.praca !== null);
    }
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

  const isModoIntervalo = filters?.filtroModo === 'intervalo';

  // Log para debug (apenas em desenvolvimento)
  useEffect(() => {
    if (IS_DEV) {
      safeLog.info('[FiltroBar] Estado do modo:', {
        isModoIntervalo,
        filtroModo: filters?.filtroModo,
        dataInicial: filters?.dataInicial,
        dataFinal: filters?.dataFinal,
      });
    }
  }, [isModoIntervalo, filters?.filtroModo, filters?.dataInicial, filters?.dataFinal]);

  return (
    <div className="space-y-3 sm:space-y-4 relative">
      {/* Switch para alternar entre modos */}
      <div className="flex items-center justify-center sm:justify-start gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <span className={`text-sm font-medium ${!isModoIntervalo ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
          Ano/Semana
        </span>
        <button
          type="button"
          onClick={handleToggleModo}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isModoIntervalo ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          role="switch"
          aria-checked={isModoIntervalo}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isModoIntervalo ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isModoIntervalo ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
          Intervalo de Datas
        </span>
      </div>

      {/* Filtros de Ano/Semana ou Intervalo de Datas */}
      {isModoIntervalo ? (
        <FiltroDateRange
          dataInicial={filters?.dataInicial ?? null}
          dataFinal={filters?.dataFinal ?? null}
          onDataInicialChange={(data) => setFilters(prev => ({ ...prev, dataInicial: data }))}
          onDataFinalChange={(data) => setFilters(prev => ({ ...prev, dataFinal: data }))}
        />
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-6">
          <FiltroSelect label="Ano" value={filters.ano !== null ? String(filters.ano) : ''} options={anosOptions} placeholder="Todos" onChange={(value) => handleChange('ano', value)} />
          <FiltroMultiSelect 
            label="Semana" 
            selected={filters.semanas ? filters.semanas.map(String) : []} 
            options={semanasOptions} 
            placeholder="Todas" 
            onSelectionChange={(values) => setFilters(prev => ({...prev, semanas: values.map(v => parseInt(v))}))} 
          />
        </div>
      )}

      {/* Outros filtros (sempre visíveis) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
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
