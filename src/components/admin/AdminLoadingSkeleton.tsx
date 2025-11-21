import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const AdminLoadingSkeleton: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
        <div className="mx-auto max-w-7xl px-4">
          {/* Skeleton Header */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
            <div className="h-4 w-96 bg-slate-200 rounded"></div>
          </div>
          
          {/* Skeleton Cards */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-6 w-6 bg-amber-200 dark:bg-amber-900 rounded animate-pulse"></div>
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 p-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-48 bg-amber-200 dark:bg-amber-900 rounded animate-pulse"></div>
                      <div className="h-4 w-64 bg-amber-200 dark:bg-amber-900 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-20 bg-emerald-200 dark:bg-emerald-900 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-md border border-slate-200 dark:border-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-6 w-6 bg-blue-200 dark:bg-blue-900 rounded animate-pulse"></div>
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <th key={i} className="pb-3">
                          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <td key={j} className="py-3">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

