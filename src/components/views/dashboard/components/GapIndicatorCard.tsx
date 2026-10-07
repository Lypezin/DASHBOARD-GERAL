import React from 'react';
import { AlertCircle } from 'lucide-react';

interface GapIndicatorCardProps {
  gap: string;
}

export const GapIndicatorCard = React.memo(function GapIndicatorCard({ gap }: GapIndicatorCardProps) {
  return (
    <div role="status" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">Gap de entrega detectado</p>
          <p className="mt-0.5 text-xs leading-5 text-rose-800 dark:text-rose-300">
            O volume entregue ficou abaixo do planejado para o período selecionado.
          </p>
        </div>
      </div>
      <p className="shrink-0 pl-6 text-xs font-medium text-rose-800 dark:text-rose-200 sm:pl-0">
        Faltam <span className="ml-1 font-mono text-sm font-semibold tabular-nums" title={gap}>{gap}</span>
      </p>
    </div>
  );
});

GapIndicatorCard.displayName = 'GapIndicatorCard';
export default GapIndicatorCard;
