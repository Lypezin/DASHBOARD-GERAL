import React, { useMemo, useCallback, useEffect } from 'react';
import { Filters, FilterOption, CurrentUser, hasFullCityAccess } from '@/types';
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
  currentUser: CurrentUser | null;
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
      // Marketing tem acesso a todas as cidades, então não precisa restringir
      praca: currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length === 1 ? currentUser.assigned_pracas[0] : null,
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
        (hasFullCityAccess(currentUser) && filters.praca !== null);
    } else {
      return filters.ano !== null || filters.semana !== null || (filters.semanas && filters.semanas.length > 0) || filters.subPraca !== null || filters.origem !== null || filters.turno !== null || (filters.turnos && filters.turnos.length > 0) ||
        (hasFullCityAccess(currentUser) && filters.praca !== null);
    }
  }, [filters, currentUser]);

  const shouldDisablePracaFilter = useMemo(() => {
    // Marketing tem acesso a todas as cidades, então não precisa desabilitar o filtro
    return Boolean(currentUser && !hasFullCityAccess(currentUser) && currentUser.assigned_pracas.length === 1);
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
    <div className="space-y-4 relative z-10">
      {/* Switch para alternar entre modos */}
      <div className="flex items-center justify-center sm:justify-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
        <span className={`text-sm font-medium ${!isModoIntervalo ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
          Ano/Semana
        </span>
        <button
          type="button"
          onClick={handleToggleModo}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isModoIntervalo ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
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
        <span className={`text-sm font-medium ${isModoIntervalo ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
          Intervalo de Datas
        </span>
      </div>

      {/* Filtros em linha horizontal */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Filtros de Ano/Semana ou Intervalo de Datas */}
        {isModoIntervalo ? (
          <div className="flex items-end gap-4 flex-1 min-w-[300px]">
            <FiltroDateRange
              dataInicial={filters?.dataInicial ?? null}
              dataFinal={filters?.dataFinal ?? null}
              onDataInicialChange={(data) => setFilters(prev => ({ ...prev, dataInicial: data }))}
              onDataFinalChange={(data) => setFilters(prev => ({ ...prev, dataFinal: data }))}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-[120px] max-w-[200px]">
              <FiltroSelect label="Ano" value={filters.ano !== null ? String(filters.ano) : ''} options={anosOptions} placeholder="Todos" onChange={(value) => handleChange('ano', value)} />
            </div>
            <div className="flex-1 min-w-[150px] max-w-[250px]">
              <FiltroMultiSelect 
                label="Semana" 
                selected={filters.semanas ? filters.semanas.map(String) : []} 
                options={semanasOptions} 
                placeholder="Todas" 
                onSelectionChange={(values) => setFilters(prev => ({...prev, semanas: values.map(v => parseInt(v))}))} 
              />
            </div>
          </>
        )}

        {/* Outros filtros (sempre visíveis) */}
        <div className="flex-1 min-w-[150px] max-w-[250px]">
          <FiltroSelect label="Praça" value={filters.praca ?? ''} options={pracas} placeholder="Todas" onChange={(value) => handleChange('praca', value)} disabled={shouldDisablePracaFilter} />
        </div>
        <div className="flex-1 min-w-[150px] max-w-[250px]">
          <FiltroMultiSelect label="Sub praça" selected={filters.subPracas || []} options={subPracas} placeholder="Todas" onSelectionChange={(values) => setFilters(prev => ({...prev, subPracas: values}))} />
        </div>
        <div className="flex-1 min-w-[150px] max-w-[250px]">
          <FiltroMultiSelect label="Origem" selected={filters.origens || []} options={origens} placeholder="Todas" onSelectionChange={(values) => setFilters(prev => ({...prev, origens: values}))} />
        </div>
        <div className="flex-1 min-w-[150px] max-w-[250px]">
          <FiltroMultiSelect label="Turno" selected={filters.turnos || []} options={turnos} placeholder="Todos" onSelectionChange={(values) => setFilters(prev => ({...prev, turnos: values}))} />
        </div>
        
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
