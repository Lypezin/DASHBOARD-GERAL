import { Skeleton } from "@/components/ui/skeleton";

interface DashboardSkeletonProps {
    contentOnly?: boolean;
}

export function DashboardSkeleton({ contentOnly = false }: DashboardSkeletonProps) {
    return (
        <div className="space-y-4 animate-fade-in w-full">
            {/* Filtros Skeleton */}
            {!contentOnly && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs Skeleton */}
            {!contentOnly && (
                <div className="w-full border-b border-slate-200 dark:border-slate-800">
                    <div className="flex gap-2 pb-2 overflow-x-auto">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-32 rounded-lg" />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column (Sidebar/Small Cards) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <Skeleton className="h-[200px] w-full rounded-lg" />
                    </div>
                </div>

                {/* Right Column (Main Charts) */}
                <div className="lg:col-span-9 space-y-6">
                    {/* Top Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
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
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <Skeleton className="h-6 w-1/4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-24 rounded-md" />
                                <Skeleton className="h-8 w-24 rounded-md" />
                            </div>
                        </div>
                        <Skeleton className="h-[400px] w-full rounded-lg" />
                    </div>

                    {/* Secondary Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <Skeleton className="h-6 w-1/3 mb-4" />
                                <Skeleton className="h-[300px] w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
