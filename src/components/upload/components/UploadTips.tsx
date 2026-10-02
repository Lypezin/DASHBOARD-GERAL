
import React from 'react';
import { Lightbulb } from 'lucide-react';

interface UploadTipsProps {
    tips?: Array<{ icon?: string; text: string }>;
}

export const UploadTips: React.FC<UploadTipsProps> = ({ tips }) => {
    if (!tips || tips.length === 0) return null;

    return (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-3.5 dark:border-amber-900/70 dark:bg-amber-950/20">
            <div className="flex items-start gap-2.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <ul className="flex-1 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {tips.map((tip, index) => (
                        <li key={index} className="leading-relaxed">
                            {tip.text}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
