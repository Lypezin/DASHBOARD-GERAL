"use client";

import { useState, useEffect } from 'react';

export const useAnimatedProgress = (targetValue: number, duration: number = 1000, delay: number = 0, isActive: boolean = true) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setProgress(0);
            return;
        }

        const timeout = setTimeout(() => {
            setProgress(targetValue);
        }, delay);

        return () => clearTimeout(timeout);
    }, [targetValue, delay, isActive]);

    return progress;
};
