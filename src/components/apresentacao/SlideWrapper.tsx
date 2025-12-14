import React, { CSSProperties } from 'react';
import { slideTransitionStyle, slideDimensionsStyle } from './constants';
import { usePresentationContext } from '@/contexts/PresentationContext';

interface SlideWrapperProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

const SlideWrapper: React.FC<SlideWrapperProps> = ({
  isVisible,
  children,
  className = '',
  style = {},
}) => {
  const { isWebMode } = usePresentationContext();

  // DEBUG PROPS
  console.log('[SlideWrapper] Params:', {
    isWebMode,
    isVisible,
    styleHasBackground: 'background' in style || 'backgroundColor' in style
  });

  // WebMode: slides flow naturally in a scrollable container
  if (isWebMode) {
    return (
      <div
        className={`slide bg-white text-slate-900 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards ${className}`.trim()}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '800px',
          overflow: 'visible',
          marginBottom: '3rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  // PreviewMode: slides are stacked absolutely within a fixed-size container
  // We use explicit pixel dimensions (1680x1188) to ensure robustness regardless of parent container quirks
  return (
    <div
      className={`slide bg-white text-slate-900 ${className}`.trim()}
      style={{
        ...slideDimensionsStyle,
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        overflow: 'hidden',
        zIndex: isVisible ? 10 : 0,
        transformOrigin: 'top left',
        backgroundColor: '#ffffff',
        ...slideTransitionStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default SlideWrapper;
