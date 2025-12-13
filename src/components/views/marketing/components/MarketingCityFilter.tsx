import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CIDADES } from '@/constants/marketing';

interface FilterState {
    dataInicial: string;
    dataFinal: string;
    praca: string | null;
}

interface MarketingCityFilterProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const MarketingCityFilter: React.FC<MarketingCityFilterProps> = ({
    filters,
    setFilters
}) => {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Praça
            </label>
            <Select
                value={filters.praca || "all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, praca: value === "all" ? null : value }))}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas as praças" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as praças</SelectItem>
                    {CIDADES.map((cidade) => (
                        <SelectItem key={cidade} value={cidade}>
                            {cidade}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
