import { useState, useEffect, useRef } from 'react';

export function useIdleDetection(timeoutMinutes: number = 5, enabled: boolean = true) {
    const [isIdle, setIsIdle] = useState(false);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled) {
            setIsIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        const resetIdle = () => {
            setIsIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                setIsIdle(true);
            }, timeoutMinutes * 60 * 1000);
        };

        resetIdle();
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetIdle));

        return () => {
            events.forEach(event => document.removeEventListener(event, resetIdle));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [enabled, timeoutMinutes]);

    return isIdle;
}
