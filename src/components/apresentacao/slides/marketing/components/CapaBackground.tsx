import React from 'react';

interface CapaBackgroundProps {
  isDark: boolean;
}

export const CapaBackground: React.FC<CapaBackgroundProps> = () => (
  <div className="pointer-events-none absolute inset-8 border border-border" aria-hidden="true" />
);
