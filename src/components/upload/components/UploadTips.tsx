
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface UploadTipsProps {
    tips?: Array<{ icon?: string; text: string }>;
}

export const UploadTips: React.FC<UploadTipsProps> = ({ tips }) => {
    if (!tips || tips.length === 0) return null;

    return (
        <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <ul className="flex-1 space-y-1 text-xs text-muted-foreground">
                    {tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-1">
                            {tip.text}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
