import React, { CSSProperties } from 'react';
import { slideBaseClass, slideDimensionsStyle, slideTransitionStyle } from './constants';

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
