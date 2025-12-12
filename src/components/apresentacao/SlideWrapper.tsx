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
    marginBottom: '3rem', // Increased spacing
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // Premium shadow
    borderRadius: '1rem', // Softer corners
    border: '1px solid rgba(226, 232, 240, 0.8)', // Subtle border
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
