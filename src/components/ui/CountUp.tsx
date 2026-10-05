'use client';

import React, { useEffect } from 'react';
import { useMotionValue, useReducedMotion, useSpring, useTransform, motion } from 'framer-motion';

interface CountUpProps {
    value: number;
    duration?: number;
}

export const CountUp: React.FC<CountUpProps> = ({ value, duration = 2 }) => {
    const shouldReduceMotion = useReducedMotion() ?? true;
    const motionValue = useMotionValue(value);
    const springValue = useSpring(motionValue, {
        stiffness: 100,
        damping: 30,
        duration: duration * 1000
    });

    const displayValue = useTransform(springValue, (latest) => Math.floor(latest));

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    // Start at the current value so loading never looks like a real zero; later
    // changes still animate from the previous value.
    if (shouldReduceMotion) return <span>{Math.floor(value)}</span>;
    return <motion.span>{displayValue}</motion.span>;
};
