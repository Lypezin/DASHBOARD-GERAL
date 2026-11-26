import React from 'react';

interface FloatingDropdownOptions {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
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
  itemCount,
  minWidth = 320,
  minHeight = 180,
  maxEstimatedHeight = 380,
  extraHeight = 0,
}: FloatingDropdownOptions): FloatingDropdownPosition | null {
  const [position, setPosition] = React.useState<FloatingDropdownPosition | null>(null);

  React.useLayoutEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (rect.bottom <= 52 || rect.top >= viewportHeight) {
        setPosition(null);
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

      setPosition({
        left,
        top: openAbove ? undefined : rect.bottom + offset,
        bottom: openAbove ? viewportHeight - rect.top + offset : undefined,
        width,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, extraHeight, isOpen, itemCount, maxEstimatedHeight, minHeight, minWidth]);

  return position;
}
