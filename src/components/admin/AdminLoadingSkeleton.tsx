import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const AdminTableSkeleton: React.FC = () => (
  <div role="status" aria-busy="true" aria-label="Carregando tabela" className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="dashboard-loading-shimmer h-7 w-40 rounded-lg" />
      <div className="dashboard-loading-shimmer h-10 w-full rounded-lg sm:w-64" />
    </div>
    <Card>
      <CardHeader>
        <div className="dashboard-loading-shimmer h-5 w-48 max-w-full rounded-md" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="dashboard-loading-shimmer h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 space-y-2">
                  <div className="dashboard-loading-shimmer h-4 w-36 max-w-full rounded" />
                  <div className="dashboard-loading-shimmer h-3 w-24 max-w-full rounded" />
                </div>
              </div>
              <div className="dashboard-loading-shimmer hidden h-4 w-20 rounded sm:block" />
              <div className="dashboard-loading-shimmer hidden h-4 w-24 rounded md:block" />
              <div className="dashboard-loading-shimmer h-8 w-8 shrink-0 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export const AdminLoadingSkeleton: React.FC = () => {
  return (
    <ErrorBoundary>
      <div role="status" aria-busy="true" aria-label="Carregando administração" className="min-h-full bg-background p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4">
            <div className="dashboard-loading-shimmer h-8 w-64 max-w-full rounded-lg" />
            <div className="dashboard-loading-shimmer h-4 w-96 max-w-full rounded" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="dashboard-loading-shimmer h-4 w-24 rounded" />
                  <div className="dashboard-loading-shimmer h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="dashboard-loading-shimmer mb-2 h-8 w-12 rounded" />
                  <div className="dashboard-loading-shimmer h-3 w-32 max-w-full rounded" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="dashboard-loading-shimmer h-10 w-24 rounded-xl" />
              <div className="dashboard-loading-shimmer h-10 w-32 rounded-xl" />
            </div>
            <AdminTableSkeleton />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
