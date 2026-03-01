import React from 'react';
import { cn } from '@/lib/utils';

export const SidebarContainer: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({ isOpen, children }) => {
    return (
        <div
            className={cn(
                "fixed right-0 top-20 z-[9999] h-[calc(100vh-6rem)] transition-transform duration-300 ease-in-out bg-white shadow-lg border-l border-slate-200 rounded-l-xl flex flex-col w-80",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {children}
            {isOpen && (
                <div className="p-2 text-center border-t border-slate-100 text-[10px] text-slate-300 bg-slate-50/50 rounded-bl-xl">
                    Atualizado em tempo real
                </div>
            )}
        </div>
    );
};
