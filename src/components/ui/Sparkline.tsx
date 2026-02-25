'use client';

import React from 'react';

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    fillOpacity?: number;
    strokeWidth?: number;
    className?: string;
    showDot?: boolean;
}

export const Sparkline = React.memo(function Sparkline({
    data,
    width = 80,
    height = 28,
    color = '#3b82f6',
    fillOpacity = 0.1,
    strokeWidth = 1.5,
    className = '',
    showDot = true,
}: SparklineProps) {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * chartW;
        const y = padding + chartH - ((val - min) / range) * chartH;
        return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`;

    const lastPoint = points[points.length - 1];

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={className}
            aria-hidden="true"
        >
            {/* Fill area */}
            <path d={areaPath} fill={color} opacity={fillOpacity} />
            {/* Line */}
            <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            {/* Last point dot */}
            {showDot && lastPoint && (
                <circle cx={lastPoint.x} cy={lastPoint.y} r={2} fill={color} />
            )}
        </svg>
    );
});
