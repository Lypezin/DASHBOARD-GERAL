import React from 'react';
import { useEntradaSaidaData } from './useEntradaSaidaData';
import { Activity } from 'lucide-react';
import { EntradaSaidaStatsCards } from './components/EntradaSaidaStatsCards';
import { EntradaSaidaWeeklyGrid } from './components/EntradaSaidaWeeklyGrid';
import { EntradaSaidaChart } from './components/EntradaSaidaChart';

interface EntradaSaidaViewProps {
    dataInicial: string | null;
    dataFinal: string | null;
    organizationId?: string;
    praca?: string | null;
}

export const EntradaSaidaView: React.FC<EntradaSaidaViewProps> = ({ dataInicial, dataFinal, organizationId, praca }) => {
    const { data, loading, error } = useEntradaSaidaData({ dataInicial, dataFinal, organizationId, praca });

    if (loading) {
        return (
            <div className="flex h-80 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-14 w-14 rounded-full border-4 border-indigo-100 dark:border-indigo-900"></div>
                        <div className="absolute top-0 left-0 h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-indigo-600"></div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-8 text-center shadow-sm dark:from-rose-950/20 dark:to-slate-900 dark:border-rose-900/50">
                <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-rose-100 flex items-center justify-center dark:bg-rose-900/40">
                    <Activity className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100">Erro ao carregar dados</h3>
                <p className="mt-2 text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <EntradaSaidaStatsCards data={data} />
            <EntradaSaidaWeeklyGrid data={data} />
            <EntradaSaidaChart data={data} />
        </div>
    );
};
