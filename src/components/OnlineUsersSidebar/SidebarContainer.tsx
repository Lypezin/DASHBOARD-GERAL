import React from 'react';
import { cn } from '@/lib/utils';

export const SidebarContainer: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({ isOpen, children }) => {
    return (
        <div
            className={cn(
                'fixed right-0 top-16 z-[9999] h-[calc(100vh-4.5rem)] w-[23rem] max-w-[92vw] rounded-l-2xl border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 flex flex-col',
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}
        >
            {children}
            {isOpen && (
                <div className="rounded-bl-2xl border-t border-slate-100 bg-slate-50/70 p-2 text-center text-[10px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-500">
                    Equipe e conversas atualizadas em tempo real
                </div>
            )}
        </div>
    );
};
