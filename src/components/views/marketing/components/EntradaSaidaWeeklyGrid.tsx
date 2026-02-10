import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EntradaSaidaRow } from './EntradaSaidaRow';
import { WeeklyData } from './EntradaSaidaCard';

interface EntradaSaidaWeeklyGridProps {
    data: WeeklyData[];
}

export const EntradaSaidaWeeklyGrid: React.FC<EntradaSaidaWeeklyGridProps> = ({ data }) => {
    // Ordenar dados por semana (mais recente primeiro)
    const sortedWeeklyData = useMemo(() => {
        return [...data].sort((a, b) => b.semana.localeCompare(a.semana));
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    Detalhamento por Semana
                </h3>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {data.length} semanas
                </Badge>
            </div>

            {sortedWeeklyData.length === 0 ? (
                <div className="text-center py-12 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Calendar className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Nenhum dado encontrado para o período selecionado.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Header Row */}
                    <div className="hidden sm:flex items-center gap-8 px-9 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="min-w-[150px]">Semana</div>
                        <div className="flex-1 grid grid-cols-3 gap-8 px-4 text-center">
                            <div>Entradas</div>
                            <div>Retomada</div>
                            <div>Saídas</div>
                        </div>
                        <div className="min-w-[140px] text-right pr-12">Saldo</div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {sortedWeeklyData.map((item, index) => (
                            <EntradaSaidaRow
                                key={item.semana}
                                item={item}
                                isFirst={index === 0}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
