import React, { CSSProperties } from 'react';
import { slideBaseClass, slideDimensionsStyle, slideTransitionStyle } from './constants';
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

  const webModeStyle: CSSProperties = {
    position: 'relative',
    height: 'auto',
    minHeight: '1188px', // SLIDE_HEIGHT
    overflow: 'visible',
    opacity: 1,
    visibility: 'visible',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    borderRadius: '0.75rem',
  };

  const previewModeStyle: CSSProperties = {
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
  };

  return (
    <div
      className={`${slideBaseClass} ${className}`.trim()}
      style={{
        backgroundColor: '#ffffff',
        ...(isWebMode ? webModeStyle : previewModeStyle),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default SlideWrapper;
