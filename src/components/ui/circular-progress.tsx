import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  color?: string;
  backgroundColor?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 12,
  className,
  showLabel = true,
  label,
  color = '#3b82f6', // blue-500
  backgroundColor = 'rgba(0, 0, 0, 0.1)',
}: CircularProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {label}
            </span>
          )}
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {clampedValue.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

