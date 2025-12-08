import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';

interface EvolucaoEmptyStateProps {
    anoSelecionado: number;
    hasNoData: boolean;
    chartError: string | null;
    labelsLength: number;
}

export const EvolucaoEmptyState: React.FC<EvolucaoEmptyStateProps> = ({
    anoSelecionado,
    hasNoData,
    chartError,
    labelsLength,
}) => {
    if (chartError) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Erro ao carregar gráfico</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{chartError}</p>
                </div>
            </div>
        );
    }

    if (hasNoData) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10 rounded-lg backdrop-blur-sm">
                <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-md">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                        <Info className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        Sem dados para exibir
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Não foram encontrados registros para o ano de {anoSelecionado} com os filtros atuais.
                        Tente selecionar outro ano ou limpar os filtros.
                    </p>
                </div>
            </div>
        );
    }

    if (labelsLength === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-lg font-medium text-amber-800 dark:text-amber-200">
                        Dados de evolução temporariamente indisponíveis
                    </p>
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                        As funções de evolução estão sendo ajustadas no servidor.
                    </p>
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        Esta funcionalidade será reativada em breve.
                    </p>
                </div>
            </div>
        )
    }

    return null;
};
