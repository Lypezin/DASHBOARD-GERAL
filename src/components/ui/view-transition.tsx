'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type ViewTransitionProps = {
  stateKey: React.Key;
  children: React.ReactNode;
  className?: string;
};

type MotionStateProps = Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>;

export function ViewTransition({ stateKey, children, className }: ViewTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionProps: MotionStateProps = shouldReduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 10, scale: 0.992 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -6, scale: 0.996 },
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={stateKey}
        {...motionProps}
        className={cn('min-w-0 transform-gpu will-change-transform', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
