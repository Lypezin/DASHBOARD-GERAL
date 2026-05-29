'use client';

import React, { useId, useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  width = 120, 
  height = 28, 
  color = '#3b82f6',
  strokeWidth = 1.5
}) => {
  const gradientId = useId().replace(/:/g, '');

  const paths = useMemo(() => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Calcular os pontos no espaço do SVG (com pequenos paddings verticais para evitar cortes)
    const padding = 2;
    const chartHeight = height - padding * 2;
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = padding + (chartHeight - ((val - min) / range) * chartHeight);
      return { x, y };
    });

    // Gerar string do Path usando curvas cúbicas Bézier suaves conectando cada ponto
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      
      // Pontos de controle horizontais suaves (tangente zero)
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Fechar a área inferior para o preenchimento do degradê
    const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return { linePath, fillPath };
  }, [data, width, height]);

  if (!paths) return null;

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      className="overflow-visible select-none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.16} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Área preenchida com gradiente vertical translúcido */}
      <path 
        d={paths.fillPath} 
        fill={`url(#${gradientId})`} 
        stroke="none" 
      />

      {/* Traço do Sparkline com glow sutil */}
      <path
        d={paths.linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
    </svg>
  );
};

export default Sparkline;
