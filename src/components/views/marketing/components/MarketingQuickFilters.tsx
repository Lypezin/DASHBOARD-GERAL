import React from 'react';
import { Button } from '@/components/ui/button';

interface MarketingQuickFiltersProps {
    onQuickFilter: (type: 'week' | 'month' | 'quarter' | 'year') => void;
}

export const MarketingQuickFilters: React.FC<MarketingQuickFiltersProps> = ({ onQuickFilter }) => {
    return (
        <div className="flex flex-wrap gap-2">
            <span className="text-sm text-slate-500 mr-2 self-center">Período rápido:</span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter('week')}
                className="text-xs"
            >
                Última semana
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter('month')}
                className="text-xs"
            >
                Este mês
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter('quarter')}
                className="text-xs"
            >
                Este trimestre
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter('year')}
                className="text-xs"
            >
                Este ano
            </Button>
        </div>
    );
};
