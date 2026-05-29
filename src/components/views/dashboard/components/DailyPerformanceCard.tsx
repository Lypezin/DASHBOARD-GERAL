import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatarHorasParaHMS } from '@/utils/formatters';
import { AderenciaDia } from '@/types';
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { DailyPerformanceTooltip } from './DailyPerformanceTooltip';
import { DailyCorridasMetrics } from './DailyCorridasMetrics';
import { cn } from '@/lib/utils';

interface DailyPerformanceCardProps {
  dia: AderenciaDia;
  index: number;
}

export const DailyPerformanceCard = React.memo(function DailyPerformanceCard({
  dia,
  index
}: DailyPerformanceCardProps) {
  const aderencia = dia.aderencia_percentual || 0;
  const isToday = new Date().getDay() === (index + 1) % 7;

  // Determinar cores dinâmicas baseadas na performance
  const isHigh = aderencia >= 90;
  const isMid = aderencia >= 70;

  const statusColor = isHigh 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : isMid 
    ? 'text-primary dark:text-blue-400' 
    : 'text-rose-600 dark:text-rose-400';

  const barColor = isHigh 
    ? 'bg-emerald-500' 
    : isMid 
    ? 'bg-primary' 
    : 'bg-rose-500';

  // Bordas semitransparentes condicionais de status de performance para escaneamento visual instantâneo
  const borderStatusClass = isHigh
    ? 'border-emerald-500/12 hover:border-emerald-500/30 hover:shadow-[0_4px_16px_rgba(16,185,129,0.04)]'
    : isMid
    ? 'border-primary/12 hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(59,130,246,0.04)]'
    : 'border-rose-500/12 hover:border-rose-500/30 hover:shadow-[0_4px_16px_rgba(239,104,104,0.04)]';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div key={`dia-${index}`} className="h-full select-none">
          <Card
            className={cn(
              "h-full cursor-help border shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200",
              isToday
                ? "bg-primary/[0.04] ring-1 ring-primary/20 dark:bg-primary/[0.02] dark:ring-primary/10"
                : "bg-card",
              borderStatusClass,
              "hover:-translate-y-0.5"
            )}
          >
            {/* Altura mínima aumentada de 140px para 210px com padding confortável p-5 para evitar qualquer overflow */}
            <CardContent className="flex h-full min-h-[210px] flex-col justify-between p-5">
              
              {/* Topo do Card: Dia e Porcentagem lado a lado (Simetria Extrema) */}
              <div className="w-full flex items-center justify-between gap-2">
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-outfit shrink-0",
                  isToday 
                    ? "bg-primary/15 text-primary" 
                    : "bg-muted text-muted-foreground/80"
                )}>
                  {dia.dia_da_semana?.substring(0, 3) || '---'}
                </div>
                
                <div className={cn("font-mono text-base font-black tracking-tight", statusColor)}>
                  {aderencia.toFixed(1)}%
                </div>
              </div>

              {/* Centro: Barra de progresso horizontal fina */}
              <div className="w-full space-y-1.5 my-3">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", barColor)}
                    style={{ width: `${Math.min(aderencia, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider pl-0.5">
                  <span>Progresso</span>
                  <span className={statusColor}>{Math.min(aderencia, 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Base superior: Métricas de Horas Reais x Metas em layout empilhado limpo */}
              <div className="w-full flex flex-col items-center text-center">
                <span className="rounded-md bg-muted/65 px-2.5 py-1 font-mono text-xs font-bold tracking-tight text-foreground/90 shadow-sm border border-border/20 w-full block truncate">
                  {formatarHorasParaHMS(dia.horas_entregues || '0')}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-bold font-mono mt-1 opacity-80 block truncate">
                  Meta: {formatarHorasParaHMS(dia.horas_a_entregar || '0')}
                </span>
              </div>

              {/* Rodapé: Contadores de corridas (Ofertadas e Completas) com divisória sutil */}
              <DailyCorridasMetrics
                ofertadas={dia.corridas_ofertadas}
                completadas={dia.corridas_completadas}
              />
              
            </CardContent>
          </Card>
        </div>
      </TooltipTrigger>
      <DailyPerformanceTooltip dia={dia} />
    </Tooltip>
  );
});

DailyPerformanceCard.displayName = 'DailyPerformanceCard';
export default DailyPerformanceCard;
