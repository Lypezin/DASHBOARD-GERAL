import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarContainerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const SidebarContainer: React.FC<SidebarContainerProps> = ({ isOpen, onClose, children }) => {
    const containerRef = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        if (!containerRef.current) return;
        (containerRef.current as HTMLElement & { inert: boolean }).inert = !isOpen;
    }, [isOpen]);

    return (
        <>
            <div
                aria-hidden={!isOpen}
                onClick={onClose}
                className={cn(
                    'fixed inset-0 z-[60] bg-slate-950/25 transition-opacity duration-300 dark:bg-slate-950/50',
                    isOpen ? 'opacity-100 backdrop-blur-[1px]' : 'pointer-events-none opacity-0'
                )}
            />

            <aside
                ref={containerRef}
                className={cn(
                    'fixed right-0 top-[5.5rem] z-[61] flex h-[calc(100dvh-5.5rem)] w-[24rem] max-w-[94vw] flex-col rounded-l-2xl border-l border-slate-200 bg-white shadow-[-12px_0_38px_rgba(15,23,42,0.12)] transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-950 lg:top-14 lg:h-[calc(100dvh-3.5rem)]',
                    isOpen ? 'visible translate-x-0' : 'invisible pointer-events-none translate-x-full'
                )}
                aria-hidden={!isOpen}
            >
                {children}
            </aside>
        </>
    );
};
