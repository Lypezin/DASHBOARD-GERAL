
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface UploadMVProgressProps {
    isRefreshingMVs?: boolean;
    mvRefreshProgress?: number;
    mvRefreshStatus?: string;
}

export const UploadMVProgress: React.FC<UploadMVProgressProps> = ({
    isRefreshingMVs, mvRefreshProgress, mvRefreshStatus
}) => {
    if (!isRefreshingMVs) return null;

    return (
        <div className="space-y-2 rounded-xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-3.5">
            <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Sincronizando dados...
                </span>
                <span className="text-amber-600 dark:text-amber-400 tabular-nums">{Math.round(mvRefreshProgress || 0)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/40">
                <div
                    className="h-full bg-amber-500 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${mvRefreshProgress || 0}%` }}
                />
            </div>
            {mvRefreshStatus && (
                <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 text-center">
                    {mvRefreshStatus}
                </p>
            )}
        </div>
    );
};
