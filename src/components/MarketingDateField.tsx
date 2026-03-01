import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface MarketingDateFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min?: string;
    max?: string;
}

export const MarketingDateField: React.FC<MarketingDateFieldProps> = ({
    id, label, value, onChange, min, max
}) => (
    <div className="space-y-1.5">
        <Label htmlFor={id} className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            {label}
        </Label>
        <Input
            id={id}
            type="date"
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            className="h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
        />
    </div>
);
