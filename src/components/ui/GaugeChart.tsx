'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

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
        const clampedValue = Math.min(Math.max(value, min), max);
        const ratio = (clampedValue - min) / (max - min);
        const angle = ratio * 180; // semicircle

        // Color based on value
        let color = '#ef4444'; // red
        if (ratio >= 0.9) color = '#10b981'; // green
        else if (ratio >= 0.7) color = '#3b82f6'; // blue
        else if (ratio >= 0.5) color = '#f59e0b'; // amber

        // SVG arc calculations
        const cx = size / 2;
        const cy = size / 2 + 5;
        const r = (size - strokeWidth) / 2 - 5;

        // Background arc (full semicircle)
        const bgStart = { x: cx - r, y: cy };
        const bgEnd = { x: cx + r, y: cy };
        const bgPath = `M ${bgStart.x},${bgStart.y} A ${r},${r} 0 0,1 ${bgEnd.x},${bgEnd.y}`;

        // Value arc
        const endAngle = Math.PI - (angle * Math.PI) / 180;
        const valEnd = {
            x: cx + r * Math.cos(endAngle),
            y: cy - r * Math.sin(endAngle),
        };
        const largeArc = angle > 180 ? 1 : 0;
        const valuePath = `M ${bgStart.x},${bgStart.y} A ${r},${r} 0 ${largeArc},1 ${valEnd.x},${valEnd.y}`;

        // Target marker
        let targetMarker = null;
        if (target !== undefined) {
            const targetRatio = (target - min) / (max - min);
            const targetAngle = Math.PI - targetRatio * Math.PI;
            targetMarker = {
                x1: cx + (r - strokeWidth / 2 - 3) * Math.cos(targetAngle),
                y1: cy - (r - strokeWidth / 2 - 3) * Math.sin(targetAngle),
                x2: cx + (r + strokeWidth / 2 + 3) * Math.cos(targetAngle),
                y2: cy - (r + strokeWidth / 2 + 3) * Math.sin(targetAngle),
            };
        }

        return { bgPath, valuePath, color, cx, cy, r, targetMarker, ratio };
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
