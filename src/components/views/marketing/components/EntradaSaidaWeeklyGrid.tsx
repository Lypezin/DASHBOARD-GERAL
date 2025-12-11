import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EntradaSaidaCard, WeeklyData } from './EntradaSaidaCard';

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedWeeklyData.map((item, index) => (
                        <EntradaSaidaCard
                            key={item.semana}
                            item={item}
                            isFirst={index === 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
