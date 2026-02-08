import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ResultadosStatusCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    gradient: string;
    iconBgColor?: string;
    textColor: string;
    pulseColor: string;
}

export const ResultadosStatusCard = React.memo(function ResultadosStatusCard({
    title,
    value,
    icon: Icon,
    gradient,
    textColor,
    pulseColor
}: ResultadosStatusCardProps) {
    return (
        <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-500 group overflow-hidden relative bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-4 -right-4 p-3 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                <Icon className="w-24 h-24 text-white" />
            </div>
            <div className="p-5 z-10 relative">
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm font-medium ${textColor} mb-2 flex items-center gap-2`}>
                            <span className={`h-2 w-2 rounded-full ${pulseColor} animate-pulse`} />
                            {title}
                        </p>
                        <p className="text-4xl font-bold text-white font-mono tracking-tight drop-shadow-lg">
                            {value}
                        </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                        <Icon className="h-7 w-7 text-white" />
                    </div>
                </div>
            </div>
        </Card>
    );
});
