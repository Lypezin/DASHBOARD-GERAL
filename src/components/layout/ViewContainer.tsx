'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps, useReducedMotion } from 'framer-motion';

export interface ViewContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  disableAnimation?: boolean;
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
  disableAnimation = false,
  ...props
}: ViewContainerProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !disableAnimation && !shouldReduceMotion;
  const containerClass = cn(
    'mx-auto w-full max-w-[1600px] min-w-0',
    className
  );

  return (
    <motion.div
      className={containerClass}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={shouldAnimate ? { duration: 0.25, ease: [0.22, 1, 0.36, 1] } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}
