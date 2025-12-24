
import React from 'react';

export const MetricCard: React.FC<{
    label: string;
    value: string;
    variant: 'week1' | 'week2';
}> = ({ label, value, variant }) => (
    <div className={`rounded-xl px-5 py-4 flex flex-col items-center justify-center h-full shadow-sm ${variant === 'week2'
        ? 'bg-gradient-to-br from-blue-50 to-white border border-blue-200'
        : 'bg-gradient-to-br from-slate-50 to-white border border-slate-200'
        }`}>
        <span className="text-sm font-semibold text-slate-500 mb-1.5 text-center">
            {label}
        </span>
        <span className={`text-3xl font-black ${variant === 'week2' ? 'text-blue-600' : 'text-slate-700'}`}>
            {value}
        </span>
    </div>
);
