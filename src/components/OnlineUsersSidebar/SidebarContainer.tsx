import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarContainerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export const SidebarContainer: React.FC<SidebarContainerProps> = ({ isOpen, onClose, children }) => {
    return (
        <>
            <div
                aria-hidden={!isOpen}
                onClick={onClose}
                className={cn(
                    'fixed inset-0 z-[9997] bg-slate-950/20 backdrop-blur-[1px] transition-opacity duration-300 dark:bg-slate-950/45',
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                )}
            />

            <aside
                className={cn(
                    'fixed right-0 top-16 z-[9998] h-[calc(100vh-5rem)] w-[24rem] max-w-[94vw] rounded-l-3xl border-l border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 flex flex-col',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
                aria-hidden={!isOpen}
            >
                {children}

                <div className="rounded-bl-3xl border-t border-slate-100 bg-slate-50/70 p-2 text-center text-[10px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-500">
                    Equipe, perfil rapido e conversas no mesmo painel
                </div>
            </aside>
        </>
    );
};
