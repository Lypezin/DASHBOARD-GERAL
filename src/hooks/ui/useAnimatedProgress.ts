"use client";

import { useState, useEffect } from 'react';

export const useAnimatedProgress = (targetValue: number, duration: number = 1000, delay: number = 0) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Reset to 0 when target changes (optional, keeps it reactive)
        setProgress(0);

        const timeout = setTimeout(() => {
            setProgress(targetValue);
        }, delay);

        return () => clearTimeout(timeout);
    }, [targetValue, delay]);

    return progress;
};
