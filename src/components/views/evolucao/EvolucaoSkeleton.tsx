import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const EvolucaoSkeleton = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Skeleton */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-10 w-24 rounded-lg" />
                            <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Gráfico Skeleton */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="mb-6 space-y-2">
                        <Skeleton className="h-7 w-56" />
                        <Skeleton className="h-4 w-80" />
                    </div>

                    <div className="h-[550px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <div className="text-center space-y-4">
                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400"></div>
                            <div className="space-y-2">
                                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Carregando dados de evolução...</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Aguarde enquanto buscamos as informações</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardContent className="p-6 space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-3 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
