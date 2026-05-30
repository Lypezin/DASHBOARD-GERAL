import React from 'react';
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
}

export const ComparacaoWeekSelector: React.FC<ComparacaoWeekSelectorProps> = ({
    todasSemanas,
    semanasSelecionadas,
    onToggleSemana
}) => {
    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-11 min-w-[220px] justify-between rounded-xl border-slate-200/80 bg-white/90 px-5 shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white dark:border-slate-800/80 dark:bg-slate-950 dark:hover:border-sky-500/40 dark:hover:bg-slate-900"
                    >
                        <span className="truncate text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {semanasSelecionadas.length > 0
                                ? `Semanas (+${semanasSelecionadas.length})`
                                : 'Adicionar semanas'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="subtle-scrollbar max-h-[400px] w-[240px] overflow-y-auto rounded-[1.4rem] border-slate-200/80 p-2 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.42)] dark:border-slate-800/70" align="start">
                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Semanas disponiveis
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="mx-2 bg-slate-100 dark:bg-slate-800" />
                    {todasSemanas.map((semana) => {
                        const semanaStr = String(semana);
                        const semanaNumLabel = semanaStr.includes('W')
                            ? (semanaStr.match(/W(\d+)/)?.[1] || semanaStr)
                            : semanaStr;
                        const isSelected = semanasSelecionadas.includes(semanaStr);

                        return (
                            <DropdownMenuCheckboxItem
                                key={semanaStr}
                                checked={isSelected}
                                onCheckedChange={() => onToggleSemana(semanaStr)}
                                className="rounded-xl px-3 py-2 text-sm font-medium transition-colors focus:bg-sky-50 focus:text-sky-600 dark:focus:bg-sky-950/30 dark:focus:text-sky-300"
                            >
                                Semana {semanaNumLabel}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex min-h-[44px] flex-1 flex-wrap items-center gap-2">
                {semanasSelecionadas.length === 0 ? (
                    <span className="rounded-full border border-slate-200/80 bg-slate-50 px-4 py-2 text-[11px] font-medium italic text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
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
                            className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/60 px-4 py-2 text-[11px] font-bold text-sky-700 shadow-[0_10px_22px_-18px_rgba(14,165,233,0.5)] transition-transform duration-200 hover:-translate-y-0.5 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-300"
                        >
                            <span className="uppercase tracking-[0.18em] opacity-60">Sem</span>
                            <span className="text-sm font-black">{displayLabel}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
