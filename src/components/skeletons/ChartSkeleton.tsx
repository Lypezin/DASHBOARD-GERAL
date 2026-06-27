import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-[300px] flex flex-col justify-end space-y-4 p-4 border rounded-xl", className)}>
      <Skeleton className="h-6 w-[30%] mb-4" />
      <div className="flex items-end space-x-2 h-full">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-full rounded-sm" 
            style={{ height: `${Math.max(20, Math.random() * 100)}%` }} 
          />
        ))}
      </div>
    </div>
  );
}
