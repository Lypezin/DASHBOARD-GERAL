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

const REDUCED_MOTION_PROPS: MotionStateProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.08, ease: 'easeIn' } },
};

const REDUCED_MOTION_INERT_PROPS: MotionStateProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1, ease: 'easeOut' } },
  exit: { opacity: 0, pointerEvents: 'none', transition: { duration: 0.08, ease: 'easeIn' } },
};

const FULL_MOTION_PROPS: MotionStateProps = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.11, ease: 'easeIn' } },
};

const FULL_MOTION_INERT_PROPS: MotionStateProps = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -6, pointerEvents: 'none', transition: { duration: 0.11, ease: 'easeIn' } },
};

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
      className="min-w-0 w-full"
    >
      {children}
    </motion.div>
  );
}

export function ViewTransition({
  stateKey,
  children,
  className,
  preventExitInteraction = true,
}: ViewTransitionProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const motionProps = shouldReduceMotion
    ? (preventExitInteraction ? REDUCED_MOTION_INERT_PROPS : REDUCED_MOTION_PROPS)
    : (preventExitInteraction ? FULL_MOTION_INERT_PROPS : FULL_MOTION_PROPS);

  return (
    <div className={cn('min-w-0 w-full', className)}>
      <AnimatePresence mode="wait" initial={false}>
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
