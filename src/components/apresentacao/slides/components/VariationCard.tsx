
import React from 'react';

export const VariationCard: React.FC<{
    label: string;
    value: string;
    positive: boolean;
    percentual: string;
    percentualPositiva: boolean;
}> = ({ label, value, positive, percentual, percentualPositiva }) => (
    <div className={`rounded-xl px-5 py-4 flex flex-col items-center justify-center h-full shadow-md ${positive
        ? 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-300'
        : 'bg-gradient-to-br from-rose-50 via-rose-100 to-white border border-rose-300'
        }`}>
        <span className="text-sm font-semibold text-slate-500 mb-1.5 text-center">
            {label}
        </span>

        {/* Variation value with arrow */}
        <div className={`flex items-center gap-1.5 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {positive ? (
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
            ) : (
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
            )}
            <span className="text-2xl font-black">{value}</span>
        </div>

        {/* Percentage badge */}
        <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${percentualPositiva
            ? 'bg-emerald-200 text-emerald-800'
            : 'bg-rose-200 text-rose-800'
            }`}>
            {percentualPositiva ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
            )}
            {percentual}
        </div>
    </div>
);
