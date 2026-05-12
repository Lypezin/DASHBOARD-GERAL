import React from 'react';
import FiltroDateRange from '@/components/FiltroDateRange';
import FiltroMultiSelect from '@/components/FiltroMultiSelect';
import FiltroSelect from '@/components/FiltroSelect';
import { Filters } from '@/types';

interface FilterPrimarySectionProps {
    isModoIntervalo: boolean;
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    anosOptions: { value: string; label: string }[];
    semanasOptions: { value: string; label: string }[];
    handleChange: (field: keyof Filters, value: any) => void;
}

export const FilterPrimarySection: React.FC<FilterPrimarySectionProps> = ({
    isModoIntervalo,
    filters,
    setFilters,
    anosOptions,
    semanasOptions,
    handleChange
}) => {
    if (isModoIntervalo) {
        return (
            <div className="w-full min-w-0 flex-auto lg:w-auto">
                <FiltroDateRange
                    dataInicial={filters?.dataInicial ?? null}
                    dataFinal={filters?.dataFinal ?? null}
                    onRangeApply={(dataInicial, dataFinal) => {
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
                    }}
                />
            </div>
        );
    }

    const selectedWeeks = filters.semanas?.length
        ? filters.semanas.map(String)
        : filters.semana !== null && filters.semana !== undefined
            ? [String(filters.semana)]
            : [];

    return (
        <>
            <div className="flex-1 min-w-[120px]">
                <FiltroSelect
                    label="Ano"
                    value={filters.ano !== null ? String(filters.ano) : ''}
                    options={anosOptions}
                    placeholder="Todos"
                    onChange={(value) => handleChange('ano', value)}
                />
            </div>
            <div className="flex-1 min-w-[120px]">
                <FiltroMultiSelect
                    label="Semana"
                    selected={selectedWeeks}
                    options={semanasOptions}
                    placeholder="Todas"
                    onSelectionChange={(values) => {
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
                    }}
                />
            </div>
        </>
    );
};
