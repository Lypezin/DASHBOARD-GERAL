import { Skeleton } from "@/components/ui/skeleton";
import { ChartSkeleton } from "@/components/skeletons/ChartSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

interface DashboardSkeletonProps {
    contentOnly?: boolean;
}

const FILTER_SKELETONS = Array.from({ length: 4 });
const TAB_SKELETONS = Array.from({ length: 5 });
const LIST_SKELETONS = Array.from({ length: 3 });
const SUMMARY_CARD_SKELETONS = Array.from({ length: 3 });
const SECONDARY_CHART_SKELETONS = Array.from({ length: 2 });

export function DashboardSkeleton({ contentOnly = false }: DashboardSkeletonProps) {
    return (
        <div className="space-y-4 motion-safe:animate-fade-in w-full">
            {/* Filtros Skeleton */}
            {!contentOnly && (
                <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_16px_42px_-38px_rgba(15,23,42,0.55)] dark:border-slate-800/70 dark:bg-slate-900/80 md:grid-cols-2 lg:grid-cols-4">
                    {FILTER_SKELETONS.map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-11 w-full rounded-2xl" />
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs Skeleton */}
            {!contentOnly && (
                <div className="w-full">
                    <div className="subtle-scrollbar flex gap-2 overflow-x-auto pb-2">
                        {TAB_SKELETONS.map((_, i) => (
                            <Skeleton key={i} className="h-11 w-32 rounded-2xl" />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column (Sidebar/Small Cards) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.55)] dark:border-slate-800/70 dark:bg-slate-900/80">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        {LIST_SKELETONS.map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.55)] dark:border-slate-800/70 dark:bg-slate-900/80">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <TableSkeleton rows={3} className="mt-4" />
                    </div>
                </div>

                {/* Right Column (Main Charts) */}
                <div className="lg:col-span-9 space-y-6">
                    {/* Top Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {SUMMARY_CARD_SKELETONS.map((_, i) => (
                            <div key={i} className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.55)] dark:border-slate-800/70 dark:bg-slate-900/80">
                                <div className="flex justify-between items-start mb-4">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                                <Skeleton className="h-8 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/3" />
                            </div>
                        ))}
                    </div>

                    {/* Large Chart Area */}
                    <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.55)] dark:border-slate-800/70 dark:bg-slate-900/80">
                        <div className="flex justify-between items-center mb-6">
                            <Skeleton className="h-6 w-1/4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-24 rounded-md" />
                                <Skeleton className="h-8 w-24 rounded-md" />
                            </div>
                        </div>
                        <ChartSkeleton className="h-[400px] border-none" />
                    </div>

                    {/* Secondary Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {SECONDARY_CHART_SKELETONS.map((_, i) => (
                            <div key={i} className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.55)] dark:border-slate-800/70 dark:bg-slate-900/80">
                                <Skeleton className="h-6 w-1/3 mb-4" />
                                <ChartSkeleton className="h-[300px] border-none" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
