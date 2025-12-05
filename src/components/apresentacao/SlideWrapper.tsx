import React, { CSSProperties } from 'react';
import { slideBaseClass, slideDimensionsStyle, slideTransitionStyle } from './constants';

interface SlideWrapperProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  hideDecorations?: boolean;
}

const SlideWrapper: React.FC<SlideWrapperProps> = ({
  isVisible,
  children,
  className = '',
  style = {},
  hideDecorations = false,
}) => {
  return (
    <div
      className={`${slideBaseClass} ${className}`.trim()}
      style={{
        ...slideDimensionsStyle,
        display: 'flex',
        flexDirection: 'column',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        overflow: 'hidden',
        position: 'absolute',
        top: 0,
        left: 0,
        ...slideTransitionStyle,
        ...style,
      }}
    >
      {/* Subtle decorative background elements */}
      {!hideDecorations && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          {/* Top-left gradient corner */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full blur-3xl" />
          {/* Bottom-right gradient corner */}
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-gradient-to-tl from-indigo-100/20 to-transparent rounded-full blur-3xl" />
          {/* Subtle top line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/50 to-transparent" />
          {/* Subtle bottom line */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1 flex flex-col" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default SlideWrapper;

