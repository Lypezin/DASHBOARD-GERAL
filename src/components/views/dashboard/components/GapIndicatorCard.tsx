import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface GapIndicatorCardProps {
  gap: string;
}

export const GapIndicatorCard = React.memo(function GapIndicatorCard({ gap }: GapIndicatorCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-xl border-rose-200/70 bg-rose-50/70 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-rose-300/80 hover:shadow-md dark:border-rose-900/40 dark:bg-rose-950/15 md:col-span-2">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />

      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <div className="shrink-0 rounded-lg border border-rose-500/15 bg-rose-500/10 p-2 dark:bg-rose-950/20">
          <AlertCircle className="h-4 w-4 text-rose-500" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-900 dark:text-rose-300">
              Gap de entrega detectado
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-rose-700/80 dark:text-rose-400/80">
              O volume entregue ficou abaixo do planejado para o periodo selecionado.
            </p>
          </div>
          <div className="flex w-fit shrink-0 items-center gap-2 rounded-lg border border-rose-500/15 bg-white/70 px-3 py-2 dark:bg-rose-950/20">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Faltam
            </span>
            <span className="max-w-[11rem] truncate font-mono text-sm font-semibold text-rose-700 dark:text-rose-300" title={gap}>
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
