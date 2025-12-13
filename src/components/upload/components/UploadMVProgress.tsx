
import React from 'react';

interface UploadMVProgressProps {
    isRefreshingMVs?: boolean;
    mvRefreshProgress?: number;
    mvRefreshStatus?: string;
}

export const UploadMVProgress: React.FC<UploadMVProgressProps> = ({
    isRefreshingMVs,
    mvRefreshProgress,
    mvRefreshStatus
}) => {
    if (!isRefreshingMVs) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span>Atualizando visualizações...</span>
                <span>{Math.round(mvRefreshProgress || 0)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/30">
                <div
                    className="h-full bg-amber-500 transition-all duration-500 ease-out"
                    style={{ width: `${mvRefreshProgress || 0}%` }}
                />
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 text-center animate-pulse">
                {mvRefreshStatus}
            </p>
        </div>
    );
};
