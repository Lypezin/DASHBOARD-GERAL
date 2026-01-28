import { useRef, useEffect } from 'react';
import { DELAYS } from '@/constants/config';

export function useDashboardDebounce(
    callback: () => void,
    dependencies: any[],
    delay: number = DELAYS.DEBOUNCE
) {
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, dependencies);
}
