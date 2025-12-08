import React from 'react';
import FiltroSelect from '@/components/FiltroSelect';
import FiltroMultiSelect from '@/components/FiltroMultiSelect';
import { Filters, FilterOption } from '@/types';

interface FilterSecondarySectionProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    pracas: FilterOption[];
    subPracas: FilterOption[];
    origens: FilterOption[];
    turnos: FilterOption[];
    handleChange: (field: keyof Filters, value: any) => void;
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
            <div className="flex-1 min-w-[150px] max-w-[250px]">
                <FiltroSelect
                    label="Praça"
                    value={filters.praca ?? ''}
                    options={pracas}
                    placeholder="Todas"
                    onChange={(value) => handleChange('praca', value)}
                    disabled={shouldDisablePracaFilter}
                />
            </div>
            <div className="flex-1 min-w-[150px] max-w-[250px]">
                <FiltroMultiSelect
                    label="Sub praça"
                    selected={filters.subPracas || []}
                    options={subPracas}
                    placeholder="Todas"
                    onSelectionChange={(values) => setFilters(prev => ({ ...prev, subPracas: values }))}
                />
            </div>
            <div className="flex-1 min-w-[150px] max-w-[250px]">
                <FiltroMultiSelect
                    label="Origem"
                    selected={filters.origens || []}
                    options={origens}
                    placeholder="Todas"
                    onSelectionChange={(values) => setFilters(prev => ({ ...prev, origens: values }))}
                />
            </div>
            <div className="flex-1 min-w-[150px] max-w-[250px]">
                <FiltroMultiSelect
                    label="Turno"
                    selected={filters.turnos || []}
                    options={turnos}
                    placeholder="Todos"
                    onSelectionChange={(values) => setFilters(prev => ({ ...prev, turnos: values }))}
                />
            </div>
        </>
    );
};
