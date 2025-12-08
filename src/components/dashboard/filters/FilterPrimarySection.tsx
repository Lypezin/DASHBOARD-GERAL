import React from 'react';
import FiltroDateRange from '@/components/FiltroDateRange';
import FiltroSelect from '@/components/FiltroSelect';
import { Filters, FilterOption } from '@/types';

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
            <div className="flex items-end gap-4 flex-auto min-w-[520px]">
                <FiltroDateRange
                    dataInicial={filters?.dataInicial ?? null}
                    dataFinal={filters?.dataFinal ?? null}
                    onDataInicialChange={(data) => {
                        setFilters(prev => {
                            if (!prev) return prev;
                            const newFilters = { ...prev, dataInicial: data };
                            if (data && prev.filtroModo !== 'intervalo') {
                                newFilters.filtroModo = 'intervalo';
                            }
                            return newFilters;
                        });
                    }}
                    onDataFinalChange={(data) => {
                        setFilters(prev => {
                            if (!prev) return prev;
                            const newFilters = { ...prev, dataFinal: data };
                            if (data && prev.filtroModo !== 'intervalo') {
                                newFilters.filtroModo = 'intervalo';
                            }
                            return newFilters;
                        });
                    }}
                    onApply={() => {
                        setFilters(prev => {
                            if (!prev) return prev;
                            if (prev.filtroModo !== 'intervalo' && (prev.dataInicial || prev.dataFinal)) {
                                return { ...prev, filtroModo: 'intervalo' };
                            }
                            return prev;
                        });
                    }}
                />
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 min-w-[120px] max-w-[200px]">
                <FiltroSelect
                    label="Ano"
                    value={filters.ano !== null ? String(filters.ano) : ''}
                    options={anosOptions}
                    placeholder="Todos"
                    onChange={(value) => handleChange('ano', value)}
                />
            </div>
            <div className="flex-1 min-w-[150px] max-w-[250px]">
                <FiltroSelect
                    label="Semana"
                    value={filters.semana !== null ? String(filters.semana) : ''}
                    options={semanasOptions}
                    placeholder="Todas"
                    onChange={(value) => {
                        setFilters(prev => {
                            const newSemana = value ? parseInt(value, 10) : null;
                            return {
                                ...prev,
                                semana: newSemana,
                                semanas: newSemana ? [newSemana] : []
                            };
                        });
                    }}
                />
            </div>
        </>
    );
};
