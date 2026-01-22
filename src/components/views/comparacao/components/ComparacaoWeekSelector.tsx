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
        <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Semanas para comparar
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10 px-4 min-w-[200px] justify-between border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <span className="truncate text-slate-700 dark:text-slate-200">
                                {semanasSelecionadas.length > 0
                                    ? "Adicionar/Remover semanas"
                                    : "Selecionar semanas..."}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[240px] max-h-[300px] overflow-y-auto" align="start">
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
                                // onSelect={(e) => e.preventDefault()}
                                >
                                    Semana {semanaNumStr}
                                </DropdownMenuCheckboxItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Selected Tags Display - Expanded for better visibility */}
                <div className="flex flex-wrap gap-2 items-center flex-1 p-2 min-h-[40px] rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 border-dashed">
                    {semanasSelecionadas.length === 0 && (
                        <span className="text-xs text-slate-400 italic px-2">Nenhuma semana selecionada</span>
                    )}
                    {semanasSelecionadas.map((semana) => (
                        <div key={semana} className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm transition-colors dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                            <span className="opacity-70">Semana</span>
                            <span>{semana}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
