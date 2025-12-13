import React from 'react';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FilterState {
    dataInicial: string;
    dataFinal: string;
    praca: string | null;
}

interface MarketingDateRangeFilterProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const MarketingDateRangeFilter: React.FC<MarketingDateRangeFilterProps> = ({
    filters,
    setFilters
}) => {
    return (
        <>
            {/* Filtro de Ano */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Ano
                </label>
                <Select
                    value={filters.dataInicial.split('-')[0]}
                    onValueChange={(year) => {
                        const currentYear = new Date().getFullYear().toString();
                        const today = new Date().toISOString().split('T')[0];

                        setFilters(prev => ({
                            ...prev,
                            dataInicial: `${year}-01-01`,
                            dataFinal: year === currentYear ? today : `${year}-12-31`
                        }));
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Data Inicial */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Data Inicial
                </label>
                <Input
                    type="date"
                    value={filters.dataInicial}
                    onChange={(e) => setFilters(prev => ({ ...prev, dataInicial: e.target.value }))}
                    className="w-full"
                />
            </div>

            {/* Data Final */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Data Final
                </label>
                <Input
                    type="date"
                    value={filters.dataFinal}
                    onChange={(e) => setFilters(prev => ({ ...prev, dataFinal: e.target.value }))}
                    className="w-full"
                />
            </div>
        </>
    );
};
