
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface UploadHeaderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

export const UploadHeader: React.FC<UploadHeaderProps> = ({ title, description, icon }) => {
    return (
        <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
                {icon}
                {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
    );
};
