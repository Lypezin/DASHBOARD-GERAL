'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ViewContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente padrão de layout para todas as Views do Dashboard.
 * Garante que a largura máxima (max-w-[1600px]) e a centralização sejam consistentes
 * em todo o sistema, sem aplicar paddings laterais desnecessários que entram em conflito
 * com o padding do DashboardShell.
 */
export function ViewContainer({
  children,
  className,
  ...props
}: ViewContainerProps) {
  const containerClass = cn(
    'mx-auto w-full max-w-[1600px] min-w-0',
    className
  );

  return (
    <div className={containerClass} {...props}>
      {children}
    </div>
  );
}
