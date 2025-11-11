import { CSSProperties } from 'react';

// Dimensões A4 em landscape (proporção ~1.414) para casar 100% com o PDF
// Mantemos um tamanho em px confortável para render/captura (html2canvas)
// 1680x1188 mantém a proporção do A4 (297/210) e evita distorções no PDF
export const SLIDE_WIDTH = 1680;
export const SLIDE_HEIGHT = 1188;

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

