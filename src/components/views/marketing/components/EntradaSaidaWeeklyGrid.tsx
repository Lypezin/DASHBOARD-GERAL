'use client';

import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EntradaSaidaRow } from './EntradaSaidaRow';
import { WeeklyData } from './EntradaSaidaCard';

interface EntradaSaidaWeeklyGridProps {
    data: WeeklyData[];
    organizationId?: string;
    praca?: string | null;
}

export const EntradaSaidaWeeklyGrid: React.FC<EntradaSaidaWeeklyGridProps> = ({ data, organizationId, praca }) => {
    const sortedWeeklyData = useMemo(() => {
        return [...data].sort((a, b) => b.semana.localeCompare(a.semana));
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                    <Calendar className="h-5 w-5 text-sky-500" />
                    Detalhamento por Semana
                </h3>
                <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {data.length} semanas
                </Badge>
            </div>

            {sortedWeeklyData.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Calendar className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Nenhum dado encontrado para o periodo selecionado.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="hidden items-center gap-8 px-9 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 sm:flex">
                        <div className="min-w-[150px]">Semana</div>
                        <div className="grid flex-1 grid-cols-3 gap-8 px-4 text-center">
                            <div>Entradas</div>
                            <div>Retomada</div>
                            <div>Saidas</div>
                        </div>
                        <div className="min-w-[140px] pr-12 text-right">Saldo</div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {sortedWeeklyData.map((item, index) => (
                            <EntradaSaidaRow
                                key={item.semana}
                                item={item}
                                isFirst={index === 0}
                                organizationId={organizationId}
                                praca={praca}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
