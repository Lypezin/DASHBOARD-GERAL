import React from 'react';
import { cn } from '@/lib/utils';

export const Section = ({ show, children }: { show: boolean, children: React.ReactNode }) => {
    if (!show) return null;
    return (
        <section className="min-w-0" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 520px' }}>
            {children}
        </section>
    );
};

export function ComparacaoPanelHeader({
    title,
    description,
    icon: Icon,
    actions,
    className,
}: {
    title: string;
    description?: string;
    icon?: React.ElementType;
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <header className={cn(
            'flex min-w-0 flex-col gap-3 border-b border-[#d8e4eb] px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5',
            className
        )}>
            <div className="flex min-w-0 items-start gap-2.5">
                {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#38708e] dark:text-sky-300" aria-hidden="true" /> : null}
                <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold leading-5 tracking-tight text-[#183f58] dark:text-slate-100">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-0.5 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
            {actions ? <div className="min-w-0 shrink-0">{actions}</div> : null}
        </header>
    );
}
