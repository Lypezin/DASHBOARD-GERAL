import React, { useCallback, useMemo } from 'react';
import FiltroDateRange from '@/components/shared/filters/FiltroDateRange';
import FiltroMultiSelect from '@/components/shared/filters/FiltroMultiSelect';
import FiltroSelect from '@/components/shared/filters/FiltroSelect';
import { Filters } from '@/types';
import type { FiltroBarChangeHandler } from '@/hooks/ui/useFiltroBar';

const EMPTY_STRING_ARRAY: string[] = [];

interface FilterPrimarySectionProps {
    appearance?: 'default' | 'quiet';
    isModoIntervalo: boolean;
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    anosOptions: { value: string; label: string }[];
    semanasOptions: { value: string; label: string }[];
    loadingSemanas: boolean;
    errorSemanas: string | null;
    onRetrySemanas: () => void;
    handleChange: FiltroBarChangeHandler;
}

export const FilterPrimarySection: React.FC<FilterPrimarySectionProps> = ({
    appearance = 'default',
    isModoIntervalo,
    filters,
    setFilters,
    anosOptions,
    semanasOptions,
    loadingSemanas,
    errorSemanas,
    onRetrySemanas,
    handleChange
}) => {
    const handleRangeApply = useCallback((dataInicial: string | null, dataFinal: string | null) => {
        setFilters(prev => {
            if (!prev) return prev;

            if (!dataInicial && !dataFinal) {
                return {
                    ...prev,
                    dataInicial: null,
                    dataFinal: null,
                };
            }

            return {
                ...prev,
                filtroModo: 'intervalo',
                ano: null,
                semana: null,
                semanas: [],
                dataInicial,
                dataFinal,
            };
        });
    }, [setFilters]);

    const handleAnoChange = useCallback((value: string | null) => {
        handleChange('ano', value);
    }, [handleChange]);

    const handleSemanasChange = useCallback((values: string[]) => {
        setFilters(prev => {
            const semanas = values
                .map((value) => parseInt(value, 10))
                .filter((value) => Number.isFinite(value))
                .sort((a, b) => a - b);

            return {
                ...prev,
                semana: semanas.length === 1 ? semanas[0] : null,
                semanas
            };
        });
    }, [setFilters]);

    const selectedWeeks = useMemo(() => {
        if (filters.semanas?.length) return filters.semanas.map(String);
        if (filters.semana !== null && filters.semana !== undefined) return [String(filters.semana)];
        return EMPTY_STRING_ARRAY;
    }, [filters.semanas, filters.semana]);

    if (isModoIntervalo) {
        return (
            <div className="col-span-1 min-w-0 sm:col-span-2 xl:col-span-3" data-filter-role="date-range">
                <FiltroDateRange
                    appearance={appearance}
                    dataInicial={filters?.dataInicial ?? null}
                    dataFinal={filters?.dataFinal ?? null}
                    onRangeApply={handleRangeApply}
                />
            </div>
        );
    }

    return (
        <>
            <FiltroSelect
                appearance={appearance}
                label="Ano"
                value={filters.ano !== null ? String(filters.ano) : ''}
                options={anosOptions}
                placeholder="Todos"
                onChange={handleAnoChange}
            />
            <div className="min-w-0">
                <FiltroMultiSelect
                    appearance={appearance}
                    label="Semana"
                    selected={selectedWeeks}
                    options={semanasOptions}
                    placeholder={loadingSemanas ? 'Carregando semanas...' : errorSemanas ? 'Semanas indisponíveis' : 'Todas'}
                    disabled={loadingSemanas}
                    onSelectionChange={handleSemanasChange}
                />
                {errorSemanas ? (
                    <button
                        type="button"
                        onClick={onRetrySemanas}
                        className="mt-1 pl-1 text-[10px] font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100"
                    >
                        Erro ao carregar semanas. Tentar novamente
                    </button>
                ) : null}
            </div>
        </>
    );
};
