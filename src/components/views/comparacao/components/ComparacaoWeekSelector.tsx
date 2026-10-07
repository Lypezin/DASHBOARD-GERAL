import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ComparacaoWeekSelectorProps {
    todasSemanas: (number | string)[];
    semanasSelecionadas: string[];
    onToggleSemana: (semana: number | string) => void;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

export const ComparacaoWeekSelector = React.memo(function ComparacaoWeekSelector({
    todasSemanas,
    semanasSelecionadas,
    onToggleSemana,
    loading,
    error,
    onRetry,
}: ComparacaoWeekSelectorProps) {
    const selectedWeeksSet = useMemo(() => new Set(semanasSelecionadas), [semanasSelecionadas]);
    const selectedWeekLabels = useMemo(() => semanasSelecionadas.map((semana) => {
        const semanaStr = String(semana);
        return semanaStr.includes('W')
            ? (semanaStr.match(/W(\d+)/)?.[1] || semanaStr)
            : semanaStr;
    }), [semanasSelecionadas]);

    const triggerLabel = useMemo(() => selectedWeekLabels.length > 0
        ? selectedWeekLabels.length <= 2
            ? `Sem ${selectedWeekLabels.join(', ')}`
            : `Sem ${selectedWeekLabels.slice(0, 2).join(', ')} +${selectedWeekLabels.length - 2}`
        : loading
            ? 'Carregando semanas...'
            : error && todasSemanas.length === 0
                ? 'Semanas indisponíveis'
                : 'Adicionar semanas', [selectedWeekLabels, loading, error, todasSemanas.length]);

    return (
        <div className="flex min-w-0 flex-col gap-2.5 lg:flex-row lg:items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={loading || todasSemanas.length === 0}
                        className="h-10 w-full min-w-0 justify-between rounded-lg border-[#d8e4eb] bg-white px-3.5 shadow-none transition-[border-color,background-color] duration-150 hover:border-[#7b9caf] hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-600 dark:hover:bg-slate-900 sm:min-w-[240px] sm:px-4 lg:w-auto"
                    >
                        <span
                            className="min-w-0 truncate whitespace-nowrap text-sm font-semibold text-slate-700 tabular-nums dark:text-slate-200"
                            title={selectedWeekLabels.length > 0 ? selectedWeekLabels.join(', ') : undefined}
                        >
                            {triggerLabel}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="subtle-scrollbar max-h-[400px] w-[280px] overflow-y-auto rounded-xl border-slate-200 p-2 shadow-[0_12px_34px_-22px_rgba(15,23,42,0.4)] dark:border-slate-800" align="start">
                    <DropdownMenuLabel className="px-2.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Semanas disponíveis
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="mx-2 bg-slate-100 dark:bg-slate-800" />
                    {todasSemanas.map((semana) => {
                        const semanaStr = String(semana);
                        const semanaNumLabel = semanaStr.includes('W')
                            ? (semanaStr.match(/W(\d+)/)?.[1] || semanaStr)
                            : semanaStr;
                        const isSelected = selectedWeeksSet.has(semanaStr);

                        return (
                            <DropdownMenuCheckboxItem
                                key={semanaStr}
                                checked={isSelected}
                                onCheckedChange={() => onToggleSemana(semanaStr)}
                                className="rounded-md px-2.5 py-2 text-sm font-medium transition-colors focus:bg-sky-50 focus:text-sky-700 dark:focus:bg-sky-950/30 dark:focus:text-sky-200"
                            >
                                Semana {semanaNumLabel}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {error ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="text-left text-[11px] font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-100"
                >
                    Não foi possível carregar as semanas. Tentar novamente
                </button>
            ) : loading ? (
                <span className="text-[11px] font-medium text-slate-400">Carregando semanas disponíveis...</span>
            ) : null}

            <div className="flex min-h-[44px] flex-1 flex-wrap items-center gap-2">
                {semanasSelecionadas.length === 0 ? (
                        <span className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Nenhuma semana ativa
                    </span>
                ) : null}

                {semanasSelecionadas.map((semana) => {
                    const displayLabel = semana.includes('W')
                        ? (semana.match(/W(\d+)/)?.[1] || semana)
                        : semana;

                    return (
                        <div
                            key={semana}
                            className="inline-flex items-center gap-2 rounded-md border border-[#d7e6ee] bg-[#f4f8fa] px-2.5 py-1.5 text-xs font-semibold text-[#285d79] transition-colors duration-150 hover:border-[#9eb9c8] hover:bg-[#edf4f7] dark:border-slate-700 dark:bg-slate-900 dark:text-sky-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                        >
                            <span className="text-slate-500 dark:text-slate-400">Semana</span>
                            <span className="tabular-nums">{displayLabel}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

ComparacaoWeekSelector.displayName = 'ComparacaoWeekSelector';
