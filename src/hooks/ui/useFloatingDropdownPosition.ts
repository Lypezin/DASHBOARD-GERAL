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
      const margin = 12;
      const preferredWidth = Math.max(rect.width, minWidth);
      const width = Math.min(preferredWidth, viewportWidth - margin * 2);
      const left = Math.min(Math.max(margin, rect.left), viewportWidth - width - margin);
      const spaceBelow = viewportHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
      const availableSpace = openAbove ? spaceAbove : spaceBelow;
      const estimatedHeight = Math.min(maxEstimatedHeight, Math.max(minHeight, itemCount * 46 + extraHeight));
      const maxHeight = Math.max(minHeight, Math.min(estimatedHeight, availableSpace));

      setPosition({
        left,
        top: openAbove ? undefined : rect.bottom + 8,
        bottom: openAbove ? viewportHeight - rect.top + 8 : undefined,
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
