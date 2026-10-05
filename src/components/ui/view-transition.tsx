'use client';

import React from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type ViewTransitionProps = {
  stateKey: React.Key;
  children: React.ReactNode;
  className?: string;
  preventExitInteraction?: boolean;
};

type MotionStateProps = Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'>;

type TransitionPanelProps = {
  children: React.ReactNode;
  motionProps: MotionStateProps;
  preventExitInteraction: boolean;
};

function TransitionPanel({ children, motionProps, preventExitInteraction }: TransitionPanelProps) {
  const isPresent = useIsPresent();
  const isExiting = preventExitInteraction && !isPresent;

  // Keep the fading view out of keyboard navigation and assistive technology.
  // The inert property is set through the DOM because the installed React 18
  // typings do not yet expose it on HTML attributes.
  const setPanelRef = React.useCallback((panel: HTMLDivElement | null) => {
    if (!panel || !preventExitInteraction) return;
    (panel as HTMLDivElement & { inert: boolean }).inert = !isPresent;
  }, [isPresent, preventExitInteraction]);

  return (
    <motion.div
      ref={setPanelRef}
      {...motionProps}
      aria-hidden={isExiting ? true : undefined}
      className="col-start-1 row-start-1 min-w-0 w-full"
    >
      {children}
    </motion.div>
  );
}

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
        <TransitionPanel
          key={stateKey}
          motionProps={motionProps}
          preventExitInteraction={preventExitInteraction}
        >
          {children}
        </TransitionPanel>
      </AnimatePresence>
    </div>
  );
}
