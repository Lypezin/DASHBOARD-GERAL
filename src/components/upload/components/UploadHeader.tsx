
import React from 'react';

interface UploadHeaderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    variant?: 'default' | 'marketing' | 'valores';
}

const variantIconBg = {
    default: 'bg-accent text-primary',
    marketing: 'bg-accent text-primary',
    valores: 'bg-accent text-primary',
};

export const UploadHeader: React.FC<UploadHeaderProps> = ({ title, description, icon, variant = 'default' }) => {
    return (
        <div className="flex items-center gap-3.5 pb-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${variantIconBg[variant]}`}>
                {icon}
            </div>
            <div>
                <h2 className="text-lg font-semibold leading-tight text-foreground">{title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
};
