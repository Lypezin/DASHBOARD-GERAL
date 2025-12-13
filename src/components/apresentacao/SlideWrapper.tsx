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
    inset: 'auto', // Override the inset-0 from base class
    height: 'auto',
    width: '100%',
    minWidth: 'auto',
    maxWidth: 'auto',
    minHeight: '800px',
    maxHeight: 'none',
    overflow: 'visible',
    opacity: 1,
    visibility: 'visible',
    marginBottom: '3rem',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    borderRadius: '1rem',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    display: 'flex',
    flexDirection: 'column',
  };

  const previewModeStyle: CSSProperties = {
    ...slideDimensionsStyle, // Use explicit px dimensions matching parent
    display: 'flex',
    flexDirection: 'column',
    opacity: isVisible ? 1 : 0,
    visibility: isVisible ? 'visible' : 'hidden',
    overflow: 'hidden',
    position: 'absolute',
    top: 0, // Ensure strictly top-left alignment
    left: 0,
    zIndex: isVisible ? 10 : 0,
    ...slideTransitionStyle,
  };

  return (
    <div
      className={`${slideBaseClass} ${className} ${isWebMode ? 'animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards' : ''}`.trim()}
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
