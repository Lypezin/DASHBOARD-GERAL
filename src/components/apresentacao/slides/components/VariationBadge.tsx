import React from 'react';
import { buildTimeTextStyle } from '../../utils';

// Adjust import based on file location. Original was in SlideTurnos.tsx which is in src/components/apresentacao/slides/
// New file is src/components/apresentacao/slides/components/VariationBadge.tsx
// So utils should be at '../../utils'? 
// Let's check where buildTimeTextStyle comes from.
// Original import: import { buildTimeTextStyle } from '../utils'; (relative to SlideTurnos.tsx)
// So it's in src/components/apresentacao/slides/utils.ts? Or src/components/apresentacao/utils?
// I'll assume standard relative import.

// Wait, I need to check where `buildTimeTextStyle` is.
// I'll assume it's accessible. If not, I'll fix it.

export const VariationBadge: React.FC<{ label: string; value: string; positive: boolean }> = ({ label, value, positive }) => (
    <div className={`flex-1 rounded-lg py-2 px-2 text-center ${positive ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
        <p className="text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wide mb-1 leading-tight">{label}</p>
        <div className={`flex items-center justify-center gap-1 font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {positive ? (
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                </svg>
            )}
            <span className="text-base leading-none" style={buildTimeTextStyle(value, 1)}>{value}</span>
        </div>
    </div>
);
