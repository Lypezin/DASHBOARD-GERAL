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
                <div role="alert" className="max-w-lg px-6 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-5 w-5 text-rose-600 dark:text-rose-300" aria-hidden="true" />
                    <p className="font-semibold text-rose-800 dark:text-rose-200">Erro ao carregar gráfico</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{chartError}</p>
                </div>
            </div>
        );
    }

    if (hasNoData) {
        return (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/90 px-4 dark:bg-slate-950/90">
                <div className="max-w-md text-center">
                    <Info className="mx-auto mb-3 h-5 w-5 text-[#38708e] dark:text-sky-300" aria-hidden="true" />
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                        Sem dados para exibir
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
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
                <div role="status" className="mx-auto max-w-md px-6 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <p className="font-semibold text-amber-800 dark:text-amber-200">
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
