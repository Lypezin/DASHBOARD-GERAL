'use client';

import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

type ChartAnimation = false | { duration: number; easing: 'easeOutQuart' };

/** Keep canvas animations consistent with the user's motion preference. */
export function useChartAnimation(duration = 520) {
  const motionPreference = useReducedMotion();
  const prefersReducedMotion = motionPreference !== false;

  return useMemo<ChartAnimation>(
    () => prefersReducedMotion ? false : { duration, easing: 'easeOutQuart' },
    [duration, prefersReducedMotion]
  );
}
