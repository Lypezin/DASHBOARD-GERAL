import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface GapIndicatorCardProps {
    gap: string;
}

export const GapIndicatorCard = React.memo(function GapIndicatorCard({ gap }: GapIndicatorCardProps) {
    return (
        <Card className="md:col-span-2 border border-rose-500/20 shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-rose-500/[0.02] dark:bg-rose-500/[0.01] relative overflow-hidden transition-all duration-200 hover:shadow-[0_4px_12px_rgba(239,68,68,0.05)]">
            {/* Barra de alerta cirúrgica na esquerda */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
            
            <CardContent className="p-5 flex items-center gap-5">
                {/* Ícone de alerta em container sutil */}
                <div className="p-2.5 bg-rose-500/10 dark:bg-rose-950/20 rounded-full border border-rose-500/20 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-300">
                        Atenção: Gap de Entrega Detectado
                    </p>
                    <p className="text-xs sm:text-sm text-rose-700/90 dark:text-rose-400 mt-1 leading-normal">
                        Faltam <span className="font-bold font-mono text-xs sm:text-sm bg-rose-500/10 border border-rose-500/10 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400">{gap}</span> para atingir a meta planejada da semana.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
});

GapIndicatorCard.displayName = 'GapIndicatorCard';
