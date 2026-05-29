import { useRef, useEffect, useMemo } from 'react';
import { DELAYS } from '@/constants/config';

export function useDashboardDebounce(
    callback: () => void,
    dependencies: readonly unknown[],
    delay: number = DELAYS.DEBOUNCE
) {
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const dependencyKey = useMemo(() => {
        return dependencies.map((dependency) => {
            if (dependency instanceof Date) return dependency.toISOString();
            if (typeof dependency === 'function') return `fn:${dependency.name || 'anonymous'}`;
            if (typeof dependency === 'object' && dependency !== null) {
                try {
                    return JSON.stringify(dependency);
                } catch {
                    return String(dependency);
                }
            }
            return String(dependency);
        }).join('|');
    }, [dependencies]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            callbackRef.current();
        }, delay);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [delay, dependencyKey]);
}
