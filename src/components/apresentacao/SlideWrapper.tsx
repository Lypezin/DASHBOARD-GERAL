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
        overflow: 'visible',
        ...slideTransitionStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default SlideWrapper;

