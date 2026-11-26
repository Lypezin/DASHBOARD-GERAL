'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function startTopLoader() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('toploader:start'));
  }
}

export function stopTopLoader() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('toploader:done'));
  }
}

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsVisible(true);
    setProgress(15);

    // Increment progress progressively up to 88%
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 88;
        }
        const step = Math.max(1, (90 - prev) * 0.12);
        return Math.min(88, prev + step);
      });
    }, 150);
  }, []);

  const completeProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 320);
  }, []);

  // Listen to custom events
  useEffect(() => {
    const handleStart = () => startProgress();
    const handleDone = () => completeProgress();

    window.addEventListener('toploader:start', handleStart);
    window.addEventListener('toploader:done', handleDone);

    return () => {
      window.removeEventListener('toploader:start', handleStart);
      window.removeEventListener('toploader:done', handleDone);
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [startProgress, completeProgress]);

  // Trigger on route and search params change (tab changes)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    startProgress();
    const doneTimer = setTimeout(() => {
      completeProgress();
    }, 450);

    return () => clearTimeout(doneTimer);
  }, [pathname, searchParams, startProgress, completeProgress]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100090] h-[3px] overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.9),0_0_6px_rgba(59,130,246,0.9)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '280ms',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Glow bead at the leading tip */}
        <div className="absolute right-0 top-0 h-[3px] w-24 bg-gradient-to-r from-transparent to-white/90 shadow-[0_0_8px_#ffffff]" />
      </div>
    </div>
  );
}
