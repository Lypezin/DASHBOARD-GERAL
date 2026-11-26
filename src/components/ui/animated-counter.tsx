'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 0.85,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const startVal = Number.isFinite(prevValue.current) ? prevValue.current : 0;
    const endVal = Number.isFinite(value) ? value : 0;

    const controls = animate(startVal, endVal, {
      duration,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    prevValue.current = value;
    return () => controls.stop();
  }, [value, duration, shouldReduceMotion]);

  const formatted = decimals > 0
    ? displayValue.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : Math.round(displayValue).toLocaleString('pt-BR');

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

interface AnimatedNumberTextProps {
  value?: string | number | null;
  duration?: number;
  className?: string;
}

/**
 * Intelligent parser that detects numbers with potential prefix/suffix
 * (e.g., "87.42%", "1.250 h", "R$ 4.500,00") and animates the numeric part.
 */
export function AnimatedNumberText({
  value,
  duration = 0.85,
  className,
}: AnimatedNumberTextProps) {
  if (typeof value === 'number') {
    const isFloat = value % 1 !== 0;
    return (
      <AnimatedCounter
        value={value}
        decimals={isFloat ? 2 : 0}
        duration={duration}
        className={className}
      />
    );
  }

  const str = String(value || '').trim();
  if (!str) return <span className={className}>-</span>;

  // Pattern matches: prefix (optional), number with optional pt-BR formatting, suffix (optional)
  // Example: "87.42%", "87,42%", "1.240 h", "R$ 15.200,00"
  const regex = /^([^\d\-+]*)([\-+−]?\d[\d.,]*)(.*)$/;
  const match = str.match(regex);

  if (!match) {
    return <span className={className}>{str}</span>;
  }

  const prefix = match[1];
  const rawNum = match[2];
  const suffix = match[3];

  // Parse Portuguese or international number
  // If comma is the decimal separator: "1.234,56" -> "1234.56"
  // If dot is decimal: "87.42" -> "87.42"
  let parsed = 0;
  let decimals = 0;

  if (rawNum.includes(',') && rawNum.includes('.')) {
    // Brazilian format 1.234,56
    const normalized = rawNum.replace(/\./g, '').replace(',', '.');
    parsed = parseFloat(normalized);
    const decimalPart = rawNum.split(',')[1];
    decimals = decimalPart ? decimalPart.length : 0;
  } else if (rawNum.includes(',')) {
    // Single comma: "87,5"
    parsed = parseFloat(rawNum.replace(',', '.'));
    const decimalPart = rawNum.split(',')[1];
    decimals = decimalPart ? decimalPart.length : 0;
  } else if (rawNum.includes('.')) {
    // Single dot: could be decimal "87.5" or thousands "1.200"
    const parts = rawNum.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      parsed = parseFloat(rawNum);
      decimals = parts[1].length;
    } else {
      // Thousands separator
      parsed = parseFloat(rawNum.replace(/\./g, ''));
      decimals = 0;
    }
  } else {
    parsed = parseFloat(rawNum);
    decimals = 0;
  }

  if (isNaN(parsed)) {
    return <span className={className}>{str}</span>;
  }

  return (
    <AnimatedCounter
      value={parsed}
      duration={duration}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      className={className}
    />
  );
}
