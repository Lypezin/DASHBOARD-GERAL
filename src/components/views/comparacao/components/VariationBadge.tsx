import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VariationBadgeProps {
    value: number | null;
}

export const VariationBadge: React.FC<VariationBadgeProps> = ({ value }) => {
    if (value === null) return null;
    const isUp = value > 0.5;
    const isDown = value < -0.5;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${isUp ? 'text-emerald-600 dark:text-emerald-400' :
            isDown ? 'text-red-600 dark:text-red-400' :
                'text-slate-400'
            }`}>
            {isUp && <TrendingUp className="w-3 h-3" />}
            {isDown && <TrendingDown className="w-3 h-3" />}
            {!isUp && !isDown && <Minus className="w-3 h-3" />}
            {isUp ? '+' : ''}{value.toFixed(1)}%
        </span>
    );
};
