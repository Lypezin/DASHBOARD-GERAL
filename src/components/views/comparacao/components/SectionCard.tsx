import React from 'react';

interface SectionCardProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    iconColor?: string;
    accentColor?: string;
    actions?: React.ReactNode;
    noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    children,
    title,
    description,
    icon,
    iconColor = 'text-slate-600 dark:text-slate-400',
    accentColor,
    actions,
    noPadding = false,
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                    {accentColor && (
                        <div className={`w-1.5 h-8 rounded-full ${accentColor}`} />
                    )}
                    {icon && !accentColor && (
                        <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${iconColor}`}>
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center">
                        {actions}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={noPadding ? '' : 'p-5'}>
                {children}
            </div>
        </div>
    );
};
