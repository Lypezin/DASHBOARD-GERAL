
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface UploadTipsProps {
    tips?: Array<{ icon?: string; text: string }>;
}

export const UploadTips: React.FC<UploadTipsProps> = ({ tips }) => {
    if (!tips || tips.length === 0) return null;

    return (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <ul className="flex-1 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-1 leading-relaxed">
                            {tip.text}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
