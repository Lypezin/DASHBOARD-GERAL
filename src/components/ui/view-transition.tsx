'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type ViewTransitionProps = {
  stateKey: React.Key;
  children: React.ReactNode;
  className?: string;
  preventExitInteraction?: boolean;
};

type MotionStateProps = Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>;

export function ViewTransition({
  stateKey,
  children,
  className,
  preventExitInteraction = false,
}: ViewTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const exitState = {
    opacity: 0,
    y: shouldReduceMotion ? 0 : -4,
    ...(preventExitInteraction ? { pointerEvents: 'none' as const } : {}),
  };
  const motionProps: MotionStateProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, ...(preventExitInteraction ? { pointerEvents: 'none' as const } : {}) },
        transition: { duration: 0.12, ease: 'easeOut' },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: exitState,
        transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <div className={cn('grid min-w-0 w-full', className)}>
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={stateKey}
          {...motionProps}
          className="col-start-1 row-start-1 min-w-0 w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
