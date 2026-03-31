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
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 px-6 min-w-[220px] justify-between rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm border-2">
                        <span className="truncate text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {semanasSelecionadas.length > 0
                                ? `Semanas (+${semanasSelecionadas.length})`
                                : "Adicionar Semanas"}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[240px] max-h-[400px] overflow-y-auto rounded-2xl p-2 shadow-2xl border-slate-100 dark:border-slate-800" align="start">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-2">Semanas Disponíveis</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                    {todasSemanas.map((semana) => {
                        const semanaStr = String(semana);
                        // Extrai apenas o número da semana para o rótulo (ex: "2026-W12" -> "12")
                        const semanaNumLabel = semanaStr.includes('W') 
                            ? (semanaStr.match(/W(\d+)/)?.[1] || semanaStr) 
                            : semanaStr;
                        const isSelected = semanasSelecionadas.includes(semanaStr);

                        return (
                            <DropdownMenuCheckboxItem
                                key={semanaStr}
                                checked={isSelected}
                                onCheckedChange={() => onToggleSemana(semanaStr)}
                                className="rounded-xl px-3 py-2 text-sm font-medium focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-950/30 dark:focus:text-indigo-400 transition-colors"
                            >
                                Semana {semanaNumLabel}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Selected Tags Display - Expanded for better visibility */}
            <div className="flex flex-wrap gap-2 items-center flex-1 min-h-[44px]">
                {semanasSelecionadas.length === 0 && (
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 italic">Nenhuma semana ativa</span>
                )}
                {semanasSelecionadas.map((semana) => {
                    const displayLabel = semana.includes('W') 
                        ? (semana.match(/W(\d+)/)?.[1] || semana) 
                        : semana;
                    return (
                        <div key={semana} className="inline-flex items-center gap-2 group rounded-full border border-indigo-100 bg-indigo-50/50 px-5 py-2 text-[11px] font-bold text-indigo-700 shadow-sm transition-all hover:scale-105 active:scale-95 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400">
                            <span className="uppercase tracking-widest opacity-60">Sem</span>
                            <span className="text-sm font-black">{displayLabel}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
