import React from 'react';
import FiltroSelect from '@/components/FiltroSelect';
import FiltroMultiSelect from '@/components/FiltroMultiSelect';
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
}

export const FilterSecondarySection: React.FC<FilterSecondarySectionProps> = ({
    filters,
    setFilters,
    pracas,
    subPracas,
    origens,
    turnos,
    handleChange,
    shouldDisablePracaFilter
}) => {
    return (
        <>
            <FiltroSelect
                label="Praca"
                value={filters.praca ?? ''}
                options={pracas}
                placeholder="Todas"
                onChange={(value) => handleChange('praca', value)}
                disabled={shouldDisablePracaFilter}
            />
            <FiltroMultiSelect
                label="Sub praca"
                selected={filters.subPracas || []}
                options={subPracas}
                placeholder="Todas"
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, subPracas: values }))}
            />
            <FiltroMultiSelect
                label="Origem"
                selected={filters.origens || []}
                options={origens}
                placeholder="Todas"
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, origens: values }))}
            />
            <FiltroMultiSelect
                label="Turno"
                selected={filters.turnos || []}
                options={turnos}
                placeholder="Todos"
                onSelectionChange={(values) => setFilters(prev => ({ ...prev, turnos: values }))}
            />
        </>
    );
};
export default FilterSecondarySection;
