import { CSSProperties } from 'react';

export const SLIDE_WIDTH = 2100;
export const SLIDE_HEIGHT = 1485;

export const slideDimensionsStyle: CSSProperties = {
  width: `${SLIDE_WIDTH}px`,
  height: `${SLIDE_HEIGHT}px`,
};

export const slideBaseClass =
  'slide bg-gradient-to-br from-blue-600 to-blue-800 text-white absolute inset-0';

export const slideTransitionStyle: CSSProperties = {
  transition: 'opacity 0.3s ease-in-out',
};

