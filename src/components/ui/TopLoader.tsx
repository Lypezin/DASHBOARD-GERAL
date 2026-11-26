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

/**
 * Sincroniza um estado booleano de loading local/sub-view com o TopLoader global
 * usando contagem de referência segura (inclusive no unmount).
 */
export function useTopLoaderSync(isLoading: boolean) {
  const isTrackingRef = useRef(false);

  useEffect(() => {
    if (isLoading && !isTrackingRef.current) {
      isTrackingRef.current = true;
      startTopLoader();
    } else if (!isLoading && isTrackingRef.current) {
      isTrackingRef.current = false;
      stopTopLoader();
    }
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (isTrackingRef.current) {
        isTrackingRef.current = false;
        stopTopLoader();
      }
    };
  }, []);
}

const SAFETY_TIMEOUT_MS = 15000;

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const activeLoadsRef = useRef(0);
  const routeLoadingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRouteKeyRef = useRef<string | null>(null);

  const clearProgressTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finishVisualProgress = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    setProgress(100);

    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    fadeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      resetTimerRef.current = setTimeout(() => {
        setProgress(0);
      }, 220);
    }, 180);
  }, []);

  const beginVisualProgress = useCallback(() => {
    clearProgressTimers();
    setIsVisible(true);
    setProgress(16);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 88;
        }
        const step = Math.max(1, (90 - prev) * 0.14);
        return Math.min(88, prev + step);
      });
    }, 150);

    safetyTimerRef.current = setTimeout(() => {
      activeLoadsRef.current = 0;
      routeLoadingRef.current = false;
      finishVisualProgress();
    }, SAFETY_TIMEOUT_MS);
  }, [clearProgressTimers, finishVisualProgress]);

  useEffect(() => {
    const handleStart = () => {
      activeLoadsRef.current += 1;
      if (activeLoadsRef.current === 1 && !routeLoadingRef.current) {
        beginVisualProgress();
      }
    };

    const handleDone = () => {
      if (activeLoadsRef.current <= 0) return;
      activeLoadsRef.current = Math.max(0, activeLoadsRef.current - 1);
      if (activeLoadsRef.current === 0 && !routeLoadingRef.current) {
        finishVisualProgress();
      }
    };

    window.addEventListener('toploader:start', handleStart);
    window.addEventListener('toploader:done', handleDone);

    return () => {
      window.removeEventListener('toploader:start', handleStart);
      window.removeEventListener('toploader:done', handleDone);
      clearProgressTimers();
    };
  }, [beginVisualProgress, finishVisualProgress, clearProgressTimers]);

  const routeKey = `${pathname ?? ''}?${searchParams?.toString() ?? ''}`;
  useEffect(() => {
    if (lastRouteKeyRef.current === null) {
      lastRouteKeyRef.current = routeKey;
      return;
    }
    if (lastRouteKeyRef.current === routeKey) {
      return;
    }
    lastRouteKeyRef.current = routeKey;

    routeLoadingRef.current = true;
    if (activeLoadsRef.current === 0) {
      beginVisualProgress();
    }

    const doneTimer = setTimeout(() => {
      routeLoadingRef.current = false;
      if (activeLoadsRef.current === 0) {
        finishVisualProgress();
      }
    }, 360);

    return () => {
      clearTimeout(doneTimer);
      routeLoadingRef.current = false;
    };
  }, [routeKey, beginVisualProgress, finishVisualProgress]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100090] h-[3px] overflow-hidden"
    >
      <div
        className="relative h-full w-full origin-left bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.85),0_0_5px_rgba(59,130,246,0.9)] transition-[transform,opacity] ease-out"
        style={{
          transform: `scaleX(${Math.max(0, Math.min(1, progress / 100))})`,
          transitionDuration: progress === 100 ? '180ms' : '240ms',
          opacity: isVisible ? 1 : 0,
        }}
      >
        <div className="absolute right-0 top-0 h-[3px] w-16 bg-gradient-to-r from-transparent to-white/90 shadow-[0_0_8px_#ffffff]" />
      </div>
    </div>
  );
}
