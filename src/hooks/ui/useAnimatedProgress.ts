"use client";

import { useState, useEffect } from 'react';

export const useAnimatedProgress = (targetValue: number, duration: number = 1000, delay: number = 0, isActive: boolean = true) => {
    const isCapturing = typeof window !== 'undefined' && (window as any).isCapturingPDF;
    const [progress, setProgress] = useState(isCapturing ? targetValue : 0);

    useEffect(() => {
        if (isCapturing) {
            setProgress(targetValue);
            return;
        }

        if (!isActive) {
            setProgress(0);
            return;
        }

        const timeout = setTimeout(() => {
            setProgress(targetValue);
        }, delay);

        return () => clearTimeout(timeout);
    }, [targetValue, delay, isActive, isCapturing]);

    return isCapturing ? targetValue : progress;
};
