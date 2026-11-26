import React from 'react';

interface FloatingDropdownOptions {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  dropdownRef?: React.RefObject<HTMLElement | null>;
  itemCount: number;
  minWidth?: number;
  minHeight?: number;
  maxEstimatedHeight?: number;
  extraHeight?: number;
}

export interface FloatingDropdownPosition {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
}

export function useFloatingDropdownPosition({
  isOpen,
  anchorRef,
  dropdownRef,
  itemCount,
  minWidth = 320,
  minHeight = 180,
  maxEstimatedHeight = 380,
  extraHeight = 0,
}: FloatingDropdownOptions): FloatingDropdownPosition | null {
  const [position, setPosition] = React.useState<FloatingDropdownPosition | null>(null);

  React.useLayoutEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    let rafId: number | null = null;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (rect.bottom <= 52 || rect.top >= viewportHeight) {
        setPosition((prev) => (prev === null ? prev : null));
        return;
      }
      const margin = 12;
      const offset = 8;
      const preferredWidth = Math.max(rect.width, minWidth);
      const width = Math.min(preferredWidth, viewportWidth - margin * 2);
      const left = Math.min(Math.max(margin, rect.left), viewportWidth - width - margin);
      const spaceBelow = Math.max(0, viewportHeight - rect.bottom - margin - offset);
      const spaceAbove = Math.max(0, rect.top - margin - offset);
      const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
      const availableSpace = Math.max(80, openAbove ? spaceAbove : spaceBelow);
      const estimatedHeight = Math.min(maxEstimatedHeight, Math.max(minHeight, itemCount * 46 + extraHeight));
      const maxHeight = Math.min(estimatedHeight, availableSpace);
      const nextTop = openAbove ? undefined : rect.bottom + offset;
      const nextBottom = openAbove ? viewportHeight - rect.top + offset : undefined;

      setPosition((prev) => {
        if (
          prev &&
          prev.left === left &&
          prev.top === nextTop &&
          prev.bottom === nextBottom &&
          prev.width === width &&
          prev.maxHeight === maxHeight
        ) {
          return prev;
        }
        return {
          left,
          top: nextTop,
          bottom: nextBottom,
          width,
          maxHeight,
        };
      });
    };

    const scheduleUpdate = (event?: Event) => {
      if (event && event.type === 'scroll' && dropdownRef?.current) {
        const target = event.target as Node | null;
        if (target && dropdownRef.current.contains(target)) {
          return;
        }
      }
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updatePosition();
      });
    };

    updatePosition();
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, { capture: true });
    };
  }, [anchorRef, dropdownRef, extraHeight, isOpen, itemCount, maxEstimatedHeight, minHeight, minWidth]);

  return position;
}
