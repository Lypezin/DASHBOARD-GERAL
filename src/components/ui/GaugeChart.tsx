'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { calculateGaugeData } from './utils/gaugeHelpers';

interface GaugeChartProps {
    value: number;
    min?: number;
    max?: number;
    target?: number;
    label?: string;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export const GaugeChart = React.memo(function GaugeChart({
    value,
    min = 0,
    max = 100,
    target,
    label,
    size = 160,
    strokeWidth = 14,
    className = '',
}: GaugeChartProps) {
    const gaugeData = useMemo(() => {
        return calculateGaugeData({ value, min, max, target, size, strokeWidth });
    }, [value, min, max, target, size, strokeWidth]);

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
                {/* Background arc */}
                <path
                    d={gaugeData.bgPath}
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Value arc (animated) */}
                <motion.path
                    d={gaugeData.valuePath}
                    fill="none"
                    stroke={gaugeData.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                {/* Target marker */}
                {gaugeData.targetMarker && (
                    <line
                        x1={gaugeData.targetMarker.x1}
                        y1={gaugeData.targetMarker.y1}
                        x2={gaugeData.targetMarker.x2}
                        y2={gaugeData.targetMarker.y2}
                        stroke="#64748b"
                        strokeWidth={2}
                        strokeDasharray="3,2"
                    />
                )}
                {/* Center text */}
                <text
                    x={gaugeData.cx}
                    y={gaugeData.cy - 5}
                    textAnchor="middle"
                    className="fill-slate-900 dark:fill-slate-100"
                    fontSize={size * 0.17}
                    fontWeight="bold"
                >
                    {Math.round(value)}%
                </text>
            </svg>
            {label && (
                <span className="text-xs text-muted-foreground -mt-2">{label}</span>
            )}
        </div>
    );
});
