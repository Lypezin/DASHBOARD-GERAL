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
        <div className="flex flex-col space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Semanas (selecione 2 ou mais)
            </label>
            <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10 px-4 w-full justify-between border-slate-200 dark:border-slate-800">
                            <span className="truncate">
                                {semanasSelecionadas.length > 0
                                    ? `${semanasSelecionadas.length} semanas selecionadas`
                                    : "Selecionar semanas..."}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto" align="start">
                        <DropdownMenuLabel>Semanas Disponíveis</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {todasSemanas.map((semana) => {
                            const semanaStr = String(semana);
                            const semanaNumStr = semanaStr.includes('W') ? (semanaStr.match(/W(\d+)/)?.[1] || semanaStr) : semanaStr;
                            const isSelected = semanasSelecionadas.includes(semanaNumStr);

                            return (
                                <DropdownMenuCheckboxItem
                                    key={semanaStr}
                                    checked={isSelected}
                                    onCheckedChange={() => onToggleSemana(semana)}
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    Semana {semanaNumStr}
                                </DropdownMenuCheckboxItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {/* Selected Tags Display */}
            {semanasSelecionadas.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {semanasSelecionadas.map((semana) => (
                        <div key={semana} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold transition-colors dark:border-blue-800 dark:bg-blue-900/10 dark:text-blue-400">
                            S{semana}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
