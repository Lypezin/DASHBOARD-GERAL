
import React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

interface UploadMVProgressProps {
    isRefreshingMVs?: boolean;
    mvRefreshProgress?: number;
    mvRefreshStatus?: string;
}

export const UploadMVProgress: React.FC<UploadMVProgressProps> = ({
    isRefreshingMVs, mvRefreshProgress, mvRefreshStatus
}) => {
    if (!isRefreshingMVs && !mvRefreshStatus) return null;

    const isDone = !isRefreshingMVs && (mvRefreshProgress || 0) >= 100;
    const progress = Math.max(0, Math.min(100, mvRefreshProgress || (isDone ? 100 : 0)));

    return (
        <div className={`space-y-2 rounded-xl border p-3.5 ${isDone
            ? 'border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/30 dark:bg-emerald-950/20'
            : 'border-amber-200/60 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20'
            }`}>
            <div className="flex items-center justify-between text-xs font-medium">
                <span className={`flex items-center gap-1.5 ${isDone
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300'
                    }`}>
                    {isDone ? (
                        <CheckCircle2 className="h-3 w-3" />
                    ) : (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                    )}
                    {isDone ? 'Dados sincronizados' : 'Sincronizando MVs...'}
                </span>
                <span className={`tabular-nums ${isDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                    }`}>{Math.round(progress)}%</span>
            </div>
            <div className={`h-1.5 w-full overflow-hidden rounded-full ${isDone ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-amber-100 dark:bg-amber-950/40'}`}>
                <div
                    className={`h-full transition-all duration-500 ease-out rounded-full ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            {mvRefreshStatus && (
                <p className={`text-[11px] text-center ${isDone
                    ? 'text-emerald-600/80 dark:text-emerald-400/70'
                    : 'text-amber-600/80 dark:text-amber-400/70'
                    }`}>
                    {mvRefreshStatus}
                </p>
            )}
        </div>
    );
};
