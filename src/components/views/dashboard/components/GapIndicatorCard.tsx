import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface GapIndicatorCardProps {
  gap: string;
}

export const GapIndicatorCard = React.memo(function GapIndicatorCard({ gap }: GapIndicatorCardProps) {
  return (
    <Card className="md:col-span-2 border border-rose-500/15 shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-rose-500/[0.02] dark:bg-rose-500/[0.01] relative overflow-hidden rounded-lg transition-all duration-200 hover:shadow-[0_4px_12px_rgba(239,68,68,0.04)] select-none">
      {/* Barra de alerta cirúrgica vertical na esquerda */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
      
      <CardContent className="p-4.5 flex items-center gap-4">
        {/* Ícone de alerta em container sutil */}
        <div className="p-2 bg-rose-500/10 dark:bg-rose-950/20 rounded-lg border border-rose-500/15 shrink-0">
          <AlertCircle className="w-4.5 h-4.5 text-rose-500" />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-900/90 dark:text-rose-300">
              Atenção: Gap de Entrega Detectado
            </p>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-0.5 leading-relaxed">
              Não atingimos o volume de horas operacionais planejado para o período selecionado.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/15 px-2 py-1 rounded-md">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Faltam
            </span>
            <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">
              {gap}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

GapIndicatorCard.displayName = 'GapIndicatorCard';
export default GapIndicatorCard;
