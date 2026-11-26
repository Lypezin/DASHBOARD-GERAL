'use client';

import React, { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

const formatterCache = new Map<number, Intl.NumberFormat>();

function getPtBrFormatter(decimals: number): Intl.NumberFormat {
  const safeDecimals = Math.max(0, Math.min(6, Math.trunc(decimals)));
  let fmt = formatterCache.get(safeDecimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat(
      'pt-BR',
      safeDecimals > 0
        ? { minimumFractionDigits: safeDecimals, maximumFractionDigits: safeDecimals }
        : { maximumFractionDigits: 0 }
    );
    formatterCache.set(safeDecimals, fmt);
  }
  return fmt;
}

function formatNumberValue(n: number, decimals: number, prefix: string, suffix: string): string {
  const fmt = getPtBrFormatter(decimals);
  let normalized = decimals > 0 ? n : Math.round(n);
  if (Object.is(normalized, -0)) normalized = 0;
  return `${prefix}${fmt.format(normalized)}${suffix}`;
}

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
  duration = 0.75,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const spanRef = useRef<HTMLSpanElement>(null);
  const safeValue = Number.isFinite(value) ? value : 0;
  const prevValue = useRef(safeValue);

  useEffect(() => {
    const el = spanRef.current;
    const startVal = Number.isFinite(prevValue.current) ? prevValue.current : safeValue;
    const endVal = safeValue;

    if (!el) {
      prevValue.current = endVal;
      return;
    }

    if (shouldReduceMotion || startVal === endVal) {
      prevValue.current = endVal;
      el.textContent = formatNumberValue(endVal, decimals, prefix, suffix);
      return;
    }

    const controls = animate(startVal, endVal, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        prevValue.current = latest;
        if (spanRef.current) {
          spanRef.current.textContent = formatNumberValue(latest, decimals, prefix, suffix);
        }
      },
      onComplete: () => {
        prevValue.current = endVal;
      },
    });

    return () => controls.stop();
  }, [safeValue, duration, decimals, prefix, suffix, shouldReduceMotion]);

  return (
    <span ref={spanRef} className={className}>
      {formatNumberValue(safeValue, decimals, prefix, suffix)}
    </span>
  );
}

interface AnimatedNumberTextProps {
  value?: string | number | null;
  duration?: number;
  className?: string;
}

/**
 * Intelligent parser that detects single numbers with potential prefix/suffix
 * (e.g., "87.42%", "1.250 h", "R$ 4.500,00", "+12,5%") and animates the numeric part.
 * Leaves compound values (HH:MM:SS, dates, "45h 20m") untouched.
 */
export function AnimatedNumberText({
  value,
  duration = 0.75,
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

  const str = String(value ?? '').trim();
  if (!str) return <span className={className}>-</span>;

  // Bail out on time strings (08:30:00), dates (12/05/2026), or compound multi-number strings (45h 20m)
  if (str.includes(':') || str.includes('/')) {
    return <span className={className}>{str}</span>;
  }

  // Match prefix (preserving '+'), optional minus sign ('-' or Unicode '−'), numeric body, and suffix
  const regex = /^([^\d\-−]*?)([\-−]?\d[\d.,]*)(.*)$/;
  const match = str.match(regex);

  if (!match) {
    return <span className={className}>{str}</span>;
  }

  const prefix = match[1];
  const rawNum = match[2].replace('−', '-');
  const suffix = match[3];

  // Bail out if suffix contains another numeric group (e.g., "45h 20m")
  if (/\d/.test(suffix)) {
    return <span className={className}>{str}</span>;
  }

  let parsed = 0;
  let decimals = 0;

  const unsigned = rawNum.startsWith('-') ? rawNum.slice(1) : rawNum;
  const lastComma = unsigned.lastIndexOf(',');
  const lastDot = unsigned.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // Brazilian format: 1.234,56
      parsed = parseFloat(rawNum.replace(/\./g, '').replace(',', '.'));
      decimals = unsigned.length - lastComma - 1;
    } else {
      // International format: 1,234.56
      parsed = parseFloat(rawNum.replace(/,/g, ''));
      decimals = unsigned.length - lastDot - 1;
    }
  } else if (lastComma !== -1) {
    if (/^\d{1,3}(,\d{3})+$/.test(unsigned) && unsigned.split(',').length > 2) {
      parsed = parseFloat(rawNum.replace(/,/g, ''));
      decimals = 0;
    } else {
      parsed = parseFloat(rawNum.replace(',', '.'));
      decimals = unsigned.length - lastComma - 1;
    }
  } else if (lastDot !== -1) {
    if (/^\d{1,3}(\.\d{3})+$/.test(unsigned)) {
      // Brazilian thousands separator: 1.200 or 1.200.000
      parsed = parseFloat(rawNum.replace(/\./g, ''));
      decimals = 0;
    } else {
      parsed = parseFloat(rawNum);
      decimals = unsigned.length - lastDot - 1;
    }
  } else {
    parsed = parseFloat(rawNum);
    decimals = 0;
  }

  if (!Number.isFinite(parsed)) {
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
