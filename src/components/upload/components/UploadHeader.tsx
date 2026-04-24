
import React from 'react';

interface UploadHeaderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    variant?: 'default' | 'marketing' | 'valores';
}

const variantIconBg = {
    default: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    marketing: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    valores: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
};

export const UploadHeader: React.FC<UploadHeaderProps> = ({ title, description, icon, variant = 'default' }) => {
    return (
        <div className="flex items-center gap-3.5 pb-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${variantIconBg[variant]}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
        </div>
    );
};
