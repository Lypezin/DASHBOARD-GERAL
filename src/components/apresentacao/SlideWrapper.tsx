'use client';

import React, { CSSProperties } from 'react';
import { useInView } from 'react-intersection-observer';
import { slideTransitionStyle, slideDimensionsStyle } from './constants';
import { usePresentationContext } from '@/contexts/PresentationContext';

import { useTheme } from '@/contexts/ThemeContext';

interface SlideWrapperProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

const SlideWrapper: React.FC<SlideWrapperProps> = ({
  isVisible,
  children,
  className = '',
  style = {},
  onClick,
}) => {
  const { isWebMode } = usePresentationContext();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // WebMode: slides flow naturally in a scrollable container
  const { ref, inView } = useInView({
    triggerOnce: false,
    rootMargin: '1200px 0px 1200px 0px', // Adjusted buffer for better performance on weaker machines
    skip: !isWebMode,
  });

  if (isWebMode) {
    return (
      <div
        ref={ref}
        className={`slide transition-colors duration-500 ${isDark ? 'text-slate-100 bg-slate-900' : 'text-slate-900 bg-white'} animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards ${className}`.trim()}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '800px', // Critical for scroll stability
          overflow: 'visible',
          marginBottom: '3rem',
          boxShadow: isDark ? '0 20px 25px -5px rgb(0 0 0 / 0.5)' : '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          borderRadius: '1rem',
          border: isDark ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: isDark ? '#020617' : '#ffffff',
          ...style,
        }}
      >
        {inView ? children : <div style={{ height: '100%' }} />}
      </div>
    );
  }

  // PreviewMode: slides are stacked absolutely within a fixed-size container
  // We use explicit pixel dimensions (1680x1188) to ensure robustness regardless of parent container quirks
  return (
    <div
      className={`slide transition-colors duration-500 ${isDark ? 'text-slate-100 bg-slate-900' : 'text-slate-900 bg-white'} ${className}`.trim()}
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
        backgroundColor: isDark ? '#020617' : '#ffffff',
        ...slideTransitionStyle,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default SlideWrapper;
