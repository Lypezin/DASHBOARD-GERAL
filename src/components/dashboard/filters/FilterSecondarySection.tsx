import React from 'react';
import FiltroSelect from '@/components/shared/filters/FiltroSelect';
import FiltroMultiSelect from '@/components/shared/filters/FiltroMultiSelect';
import { Filters, FilterOption } from '@/types';
import type { FiltroBarChangeHandler } from '@/hooks/ui/useFiltroBar';

interface FilterSecondarySectionProps {
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
}

export const FilterSecondarySection: React.FC<FilterSecondarySectionProps> = ({
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
}) => {
    const isUnavailable = (options: FilterOption[]) => options.length === 0 && Boolean(optionsError);
    const isWaitingForOptions = (options: FilterOption[]) => options.length === 0 && optionsLoading;
    const placeholderFor = (options: FilterOption[], allLabel: string) => {
        if (isWaitingForOptions(options)) return 'Carregando opções...';
        if (isUnavailable(options)) return 'Opções indisponíveis';
        return allLabel;
    };

    return (
        <>
            <FiltroSelect
                label="Praça"
                value={filters.praca ?? ''}
                options={pracas}
                placeholder={placeholderFor(pracas, 'Todas')}
                onChange={(value) => handleChange('praca', value)}
                disabled={shouldDisablePracaFilter || isWaitingForOptions(pracas) || isUnavailable(pracas)}
            />
            <FiltroMultiSelect
                label="Sub praça"
                selected={filters.subPracas || []}
                options={subPracas}
                placeholder={placeholderFor(subPracas, 'Todas')}
                disabled={isWaitingForOptions(subPracas) || isUnavailable(subPracas)}
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, subPraca: values[0] || null, subPracas: values }))}
            />
            <FiltroMultiSelect
                label="Origem"
                selected={filters.origens || []}
                options={origens}
                placeholder={placeholderFor(origens, 'Todas')}
                disabled={isWaitingForOptions(origens) || isUnavailable(origens)}
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, origem: values[0] || null, origens: values }))}
            />
            <FiltroMultiSelect
                label="Turno"
                selected={filters.turnos || []}
                options={turnos}
                placeholder={placeholderFor(turnos, 'Todos')}
                disabled={isWaitingForOptions(turnos) || isUnavailable(turnos)}
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, turno: values[0] || null, turnos: values }))}
            />
        </>
    );
};
export default FilterSecondarySection;
