import React from 'react';

interface SectionCardProps {
    children: React.ReactNode;
    title: string;
    description: string;
    icon: React.ReactNode;
    iconColor?: string;
    actions?: React.ReactNode;
    noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    children,
    title,
    description,
    icon,
    iconColor = 'text-slate-600 dark:text-slate-400',
    actions,
    noPadding = false,
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden transition-colors duration-200">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 ${iconColor}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center">
                        {actions}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </div>
    );
};
