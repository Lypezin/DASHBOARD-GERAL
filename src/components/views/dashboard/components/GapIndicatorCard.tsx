import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface GapIndicatorCardProps {
    gap: string;
}

export const GapIndicatorCard: React.FC<GapIndicatorCardProps> = ({ gap }) => {
    return (
        <Card className="md:col-span-2 border-none shadow-md bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
            <CardContent className="p-5 flex items-center gap-5">
                <div className="p-3 bg-white dark:bg-rose-950/50 rounded-full shadow-sm border border-rose-100 dark:border-rose-900/50 ring-4 ring-rose-50 dark:ring-rose-900/20">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div className="flex-1">
                    <p className="text-base font-bold text-rose-900 dark:text-rose-200">
                        Atenção: Gap de Entrega Detectado
                    </p>
                    <p className="text-sm text-rose-700 dark:text-rose-300 mt-0.5">
                        Faltam <span className="font-bold font-mono text-base bg-rose-100 dark:bg-rose-900/50 px-1.5 rounded mx-1">{gap}</span> para atingir a meta planejada da semana.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
