'use client';

import React from 'react';

interface CapaFooterProps {
    isDark: boolean;
}

export const CapaFooter: React.FC<CapaFooterProps> = ({ isDark }) => {
    return (
        <div className="absolute bottom-12 flex w-full items-center justify-center px-20">
            <div className={`border-t border-border pt-3 text-[10px] font-medium uppercase tracking-[0.22em] ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                GO Itaim · Dashboard Geral
            </div>
        </div>
    );
};
