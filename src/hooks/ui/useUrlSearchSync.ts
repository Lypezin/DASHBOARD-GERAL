import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useUrlSearchSync(paramName: string, value: string, debounceMs = 250, enabled = true) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!enabled) return;

        const timeoutId = window.setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            const normalizedValue = value.trim();

            if (normalizedValue) {
                if (params.get(paramName) !== value) {
                    params.set(paramName, value);
                } else {
                    return;
                }
            } else if (params.has(paramName)) {
                params.delete(paramName);
            } else {
                return;
            }

            const nextQuery = params.toString();
            const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
            const currentQuery = searchParams.toString();
            const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

            if (nextUrl !== currentUrl) {
                router.replace(nextUrl, { scroll: false });
            }
        }, debounceMs);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [debounceMs, enabled, value, pathname, router, searchParams, paramName]);
}
