import React from 'react';
import { buildTimeTextStyle } from '@/components/apresentacao/utils';

interface VariationBadgeProps {
    label: string;
    value: string;
    positive: boolean;
}

export const VariationBadge: React.FC<VariationBadgeProps> = ({ label, value, positive }) => (
    <div className={`flex-1 rounded-lg py-1.5 px-1.5 text-center ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
        <p className="text-[0.6rem] font-semibold text-slate-500 uppercase tracking-wide mb-1 leading-tight">{label}</p>
        <div className={`flex items-center justify-center gap-1 font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {positive ? (
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
            ) : (
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
            )}
            <span className="text-sm leading-none" style={buildTimeTextStyle(value, 0.85)}>{value}</span>
        </div>
    </div>
);
