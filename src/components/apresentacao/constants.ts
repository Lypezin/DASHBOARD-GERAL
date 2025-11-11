import { CSSProperties } from 'react';

// Dimensões A4 em landscape (297mm x 210mm) em pixels @ 72 DPI
// Ajustado para proporção 16:9 para melhor visualização
export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;

export const slideDimensionsStyle: CSSProperties = {
  width: `${SLIDE_WIDTH}px`,
  height: `${SLIDE_HEIGHT}px`,
  minWidth: `${SLIDE_WIDTH}px`,
  minHeight: `${SLIDE_HEIGHT}px`,
  maxWidth: `${SLIDE_WIDTH}px`,
  maxHeight: `${SLIDE_HEIGHT}px`,
};

export const slideBaseClass =
  'slide bg-gradient-to-br from-blue-600 to-blue-800 text-white absolute inset-0';

export const slideTransitionStyle: CSSProperties = {
  transition: 'opacity 0.3s ease-in-out',
};

