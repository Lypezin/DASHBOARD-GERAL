'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ViewContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Layout shared by dashboard views. Tab changes are animated once by
 * DashboardViewsRenderer; keeping this wrapper structural avoids stacking a
 * second entrance animation around each page.
 */
export function ViewContainer({ children, className, ...props }: ViewContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[1600px] min-w-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}
