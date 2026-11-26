import { useState, useEffect, useRef } from 'react';

const IDLE_RESET_THROTTLE_MS = 1000;

export function useIdleDetection(timeoutMinutes: number = 5, enabled: boolean = true) {
    const [isIdle, setIsIdle] = useState(false);
    const isIdleRef = useRef(false);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastResetAtRef = useRef(0);

    useEffect(() => {
        if (!enabled) {
            isIdleRef.current = false;
            setIsIdle(false);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        const scheduleIdleTimer = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                isIdleRef.current = true;
                setIsIdle(true);
            }, timeoutMinutes * 60 * 1000);
        };

        const resetIdle = () => {
            const now = Date.now();
            if (!isIdleRef.current && now - lastResetAtRef.current < IDLE_RESET_THROTTLE_MS) {
                return;
            }
            lastResetAtRef.current = now;
            if (isIdleRef.current) {
                isIdleRef.current = false;
                setIsIdle(false);
            }
            scheduleIdleTimer();
        };

        lastResetAtRef.current = Date.now();
        scheduleIdleTimer();

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] as const;
        const listenerOptions: AddEventListenerOptions = { passive: true };
        events.forEach(event => document.addEventListener(event, resetIdle, listenerOptions));

        return () => {
            events.forEach(event => document.removeEventListener(event, resetIdle, listenerOptions));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [enabled, timeoutMinutes]);

    return isIdle;
}
