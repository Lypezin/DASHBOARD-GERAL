import { useEffect, RefObject } from 'react';

export function useClickOutside(
    refs: Array<RefObject<HTMLElement | null>>,
    callback: () => void,
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled) return;

        function handleClickOutside(event: MouseEvent) {
            // Verifica se o clique ocorreu fora de todos os elementos passados nas refs
            const isOutsideAll = refs.every(
                (ref) => ref.current && !ref.current.contains(event.target as Node)
            );

            if (isOutsideAll) {
                callback();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [refs, callback, enabled]); // refs deve ser um array estável para evitar loop de efeitos
}
