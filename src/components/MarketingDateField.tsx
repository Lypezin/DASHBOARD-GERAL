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
        <Label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
        </Label>
        <Input
            id={id}
            type="date"
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            className="h-9 border-[#d8e4eb] bg-white text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-blue-400"
        />
    </div>
);
