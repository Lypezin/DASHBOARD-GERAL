import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useUrlSearchSync(paramName: string, value: string) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            if (params.get(paramName) !== value) {
                params.set(paramName, value);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
        } else if (params.has(paramName)) {
            params.delete(paramName);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [value, pathname, router, searchParams, paramName]);
}
