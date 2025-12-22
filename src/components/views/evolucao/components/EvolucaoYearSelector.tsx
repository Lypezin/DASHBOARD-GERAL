import React from 'react';
import { Calendar } from 'lucide-react';

interface EvolucaoYearSelectorProps {
    anoSelecionado: number;
    anosDisponiveis: number[];
    onAnoChange: (ano: number) => void;
}

export const EvolucaoYearSelector: React.FC<EvolucaoYearSelectorProps> = ({
    anoSelecionado,
    anosDisponiveis,
    onAnoChange,
}) => {
    return (
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Ano:
            </label>
            <select
                value={anoSelecionado}
                onChange={(e) => onAnoChange(Number(e.target.value))}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
                {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                        {ano}
                    </option>
                ))}
            </select>
        </div>
    );
};
