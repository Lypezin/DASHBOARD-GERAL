import React from 'react';
import { getAderenciaColor, getAderenciaBgColor } from '@/utils/formatters';
import { formatarHorasParaHMS } from '@/utils/formatters';

const AderenciaCard = React.memo(({ 
  title, 
  planejado, 
  entregue, 
  percentual 
}: { 
  title: string; 
  planejado: string; 
  entregue: string; 
  percentual: number;
}) => {
  const colorClass = getAderenciaColor(percentual);
  const bgClass = getAderenciaBgColor(percentual);

  return (
    <div className={`group relative rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-4 sm:p-5 lg:p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-white/30 dark:border-white/10 dark:bg-slate-900/90 ${bgClass} overflow-hidden`}>
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0" title={title}>{title}</h3>
        <span className={`shrink-0 rounded-full px-2 sm:px-3 py-1 text-sm sm:text-base lg:text-lg font-bold ${colorClass} bg-white/50 dark:bg-slate-900/50`}>
          {(percentual ?? 0).toFixed(1)}%
        </span>
      </div>
      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white/30 px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-slate-900/30">
          <span className="font-medium text-slate-600 dark:text-slate-400 shrink-0">Planejado:</span>
          <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">{formatarHorasParaHMS(planejado)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white/30 px-2 sm:px-3 py-1.5 sm:py-2 dark:bg-slate-900/30">
          <span className="font-medium text-slate-600 dark:text-slate-400 shrink-0">Entregue:</span>
          <span className="font-mono text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 truncate">{formatarHorasParaHMS(entregue)}</span>
        </div>
      </div>
      <div className="mt-3 sm:mt-4 h-2 sm:h-2.5 overflow-hidden rounded-full bg-white/50 dark:bg-slate-800/50">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${percentual >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : percentual >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        ></div>
      </div>
    </div>
  );
});
AderenciaCard.displayName = 'AderenciaCard';

export default AderenciaCard;
