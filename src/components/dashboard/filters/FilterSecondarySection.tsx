import React from 'react';
import FiltroSelect from '@/components/shared/filters/FiltroSelect';
import FiltroMultiSelect from '@/components/shared/filters/FiltroMultiSelect';
import { Filters, FilterOption } from '@/types';
import type { FiltroBarChangeHandler } from '@/hooks/ui/useFiltroBar';
import type { DimensionFilterSupport } from '@/utils/filters/dimensionFilterSupport';

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
                onChange={(value) => handleChange('praca', value)}
                disabled={shouldDisablePracaFilter || isWaitingForOptions(pracas) || isUnavailable(pracas)}
            />
            <FiltroMultiSelect
                appearance={appearance}
                label="Sub praça"
                selected={dimensionSupport.subPraca
                    ? (filters.subPracas?.length ? filters.subPracas : filters.subPraca ? [filters.subPraca] : [])
                    : []}
                options={subPracas}
                placeholder={placeholderFor(subPracas, 'Todas', dimensionSupport.subPraca)}
                disabled={!dimensionSupport.subPraca || isWaitingForOptions(subPracas) || isUnavailable(subPracas)}
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, subPraca: values[0] || null, subPracas: values }))}
            />
            <FiltroMultiSelect
                appearance={appearance}
                label="Origem"
                selected={dimensionSupport.origem
                    ? (filters.origens?.length ? filters.origens : filters.origem ? [filters.origem] : [])
                    : []}
                options={origens}
                placeholder={placeholderFor(origens, 'Todas', dimensionSupport.origem)}
                disabled={!dimensionSupport.origem || isWaitingForOptions(origens) || isUnavailable(origens)}
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, origem: values[0] || null, origens: values }))}
            />
            <FiltroMultiSelect
                appearance={appearance}
                label="Turno"
                selected={dimensionSupport.turno
                    ? (filters.turnos?.length ? filters.turnos : filters.turno ? [filters.turno] : [])
                    : []}
                options={turnos}
                placeholder={placeholderFor(turnos, 'Todos', dimensionSupport.turno)}
                disabled={!dimensionSupport.turno || isWaitingForOptions(turnos) || isUnavailable(turnos)}
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, turno: values[0] || null, turnos: values }))}
            />
        </>
    );
};
export default FilterSecondarySection;
