'use client';

import React, { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

interface CountUpProps {
    value: number;
    duration?: number;
}

export const CountUp: React.FC<CountUpProps> = ({ value, duration = 2 }) => {
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        stiffness: 100,
        damping: 30,
        duration: duration * 1000
    });

    const displayValue = useTransform(springValue, (latest) => Math.floor(latest));

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    return <motion.span>{displayValue}</motion.span>;
};
