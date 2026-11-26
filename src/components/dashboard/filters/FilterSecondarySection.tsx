import React, { useCallback, useMemo } from 'react';
import FiltroSelect from '@/components/shared/filters/FiltroSelect';
import FiltroMultiSelect from '@/components/shared/filters/FiltroMultiSelect';
import { Filters, FilterOption } from '@/types';
import type { FiltroBarChangeHandler } from '@/hooks/ui/useFiltroBar';
import type { DimensionFilterSupport } from '@/utils/filters/dimensionFilterSupport';

const EMPTY_STRING_ARRAY: string[] = [];

interface FilterSecondarySectionProps {
    appearance?: 'default' | 'quiet';
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    pracas: FilterOption[];
    subPracas: FilterOption[];
    origens: FilterOption[];
    turnos: FilterOption[];
    handleChange: FiltroBarChangeHandler;
    shouldDisablePracaFilter: boolean;
    optionsLoading: boolean;
    optionsError: string | null;
    dimensionSupport: DimensionFilterSupport;
}

export const FilterSecondarySection: React.FC<FilterSecondarySectionProps> = ({
    appearance = 'default',
    filters,
    setFilters,
    pracas,
    subPracas,
    origens,
    turnos,
    handleChange,
    shouldDisablePracaFilter,
    optionsLoading,
    optionsError,
    dimensionSupport,
}) => {
    const selectedSubPracas = useMemo(() => {
        if (!dimensionSupport.subPraca) return EMPTY_STRING_ARRAY;
        if (filters.subPracas?.length) return filters.subPracas;
        return filters.subPraca ? [filters.subPraca] : EMPTY_STRING_ARRAY;
    }, [dimensionSupport.subPraca, filters.subPraca, filters.subPracas]);

    const selectedOrigens = useMemo(() => {
        if (!dimensionSupport.origem) return EMPTY_STRING_ARRAY;
        if (filters.origens?.length) return filters.origens;
        return filters.origem ? [filters.origem] : EMPTY_STRING_ARRAY;
    }, [dimensionSupport.origem, filters.origem, filters.origens]);

    const selectedTurnos = useMemo(() => {
        if (!dimensionSupport.turno) return EMPTY_STRING_ARRAY;
        if (filters.turnos?.length) return filters.turnos;
        return filters.turno ? [filters.turno] : EMPTY_STRING_ARRAY;
    }, [dimensionSupport.turno, filters.turno, filters.turnos]);

    const handlePracaChange = useCallback(
        (value: string | null) => handleChange('praca', value),
        [handleChange]
    );
    const handleSubPracaChange = useCallback(
        (values: string[]) => setFilters(prev => ({ ...prev, subPraca: values[0] || null, subPracas: values })),
        [setFilters]
    );
    const handleOrigemChange = useCallback(
        (values: string[]) => setFilters(prev => ({ ...prev, origem: values[0] || null, origens: values })),
        [setFilters]
    );
    const handleTurnoChange = useCallback(
        (values: string[]) => setFilters(prev => ({ ...prev, turno: values[0] || null, turnos: values })),
        [setFilters]
    );

    const isUnavailable = (options: FilterOption[]) => options.length === 0 && Boolean(optionsError);
    const isWaitingForOptions = (options: FilterOption[]) => options.length === 0 && optionsLoading;
    const placeholderFor = (options: FilterOption[], allLabel: string, supported: boolean) => {
        if (!supported) return 'Não usado nesta guia';
        if (isWaitingForOptions(options)) return 'Carregando opções...';
        if (isUnavailable(options)) return 'Opções indisponíveis';
        return allLabel;
    };

    return (
        <>
            <FiltroSelect
                appearance={appearance}
                label="Praça"
                value={filters.praca ?? ''}
                options={pracas}
                placeholder={placeholderFor(pracas, 'Todas', true)}
                onChange={handlePracaChange}
                disabled={shouldDisablePracaFilter || isWaitingForOptions(pracas) || isUnavailable(pracas)}
            />
            <FiltroMultiSelect
                appearance={appearance}
                label="Sub praça"
                selected={selectedSubPracas}
                options={subPracas}
                placeholder={placeholderFor(subPracas, 'Todas', dimensionSupport.subPraca)}
                disabled={!dimensionSupport.subPraca || isWaitingForOptions(subPracas) || isUnavailable(subPracas)}
                onSelectionChange={handleSubPracaChange}
            />
            <FiltroMultiSelect
                appearance={appearance}
                label="Origem"
                selected={selectedOrigens}
                options={origens}
                placeholder={placeholderFor(origens, 'Todas', dimensionSupport.origem)}
                disabled={!dimensionSupport.origem || isWaitingForOptions(origens) || isUnavailable(origens)}
                onSelectionChange={handleOrigemChange}
            />
            <FiltroMultiSelect
                appearance={appearance}
                label="Turno"
                selected={selectedTurnos}
                options={turnos}
                placeholder={placeholderFor(turnos, 'Todos', dimensionSupport.turno)}
                disabled={!dimensionSupport.turno || isWaitingForOptions(turnos) || isUnavailable(turnos)}
                onSelectionChange={handleTurnoChange}
            />
        </>
    );
};
export default FilterSecondarySection;
