import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
}

export function TableSkeleton({
    rows = 5,
    columns = 4,
    showHeader = true
}: TableSkeletonProps) {
    return (
        <div className="w-full space-y-4 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            {showHeader && (
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
            )}

            {/* Filters/Stats Cards Skeleton Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={`card-${i}`} className="h-24 w-full rounded-xl" />
                ))}
            </div>

            {/* Table Area */}
            <div className="rounded-md border border-slate-200 dark:border-slate-800 p-4">
                {/* Table Header */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton
                            key={`head-${i}`}
                            className={`h-6 ${i === 0 ? 'w-1/3' : 'w-1/6'}`}
                        />
                    ))}
                </div>

                {/* Table Rows */}
                <div className="space-y-4">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div
                            key={`row-${i}`}
                            className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-700"
                            style={{
                                animationDelay: `${i * 0.1}s`,
                                animationFillMode: 'both'
                            }}
                        >
                            {Array.from({ length: columns }).map((_, j) => (
                                <Skeleton
                                    key={`cell-${i}-${j}`}
                                    className={`h-12 ${j === 0 ? 'w-1/3' : 'w-1/6'}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
