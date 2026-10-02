import React, { CSSProperties } from 'react';
import { slideTransitionStyle, slideDimensionsStyle } from './constants';
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`slide transition-colors duration-500 ${isDark ? 'text-slate-100 bg-slate-900' : 'text-slate-900 bg-white'} ${isVisible ? 'slide-animate' : ''} ${className}`.trim()}
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
