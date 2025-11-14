import React from 'react';

const MetricCard = React.memo(function MetricCard({ 
  title, 
  value, 
  icon, 
  percentage,
  percentageLabel,
  color = 'blue'
}: { 
  title: string; 
  value: number | string; 
  icon: string; 
  percentage?: number;
  percentageLabel?: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    red: 'from-rose-500 to-pink-500',
    purple: 'from-violet-500 to-purple-500',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/90">
      <div className={`absolute right-0 top-0 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10 blur-3xl transition-opacity group-hover:opacity-25`}></div>
      
      <div className="relative flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 pr-1 sm:pr-2">
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900 transition-transform group-hover:scale-105 dark:text-white leading-tight" style={{ fontVariantNumeric: 'tabular-nums', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
          {percentage !== undefined && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2 flex-wrap">
              <div className="rounded-lg bg-blue-50 px-2 py-1 dark:bg-blue-950/30">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              {percentageLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{percentageLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${colorClasses[color]} text-lg sm:text-xl md:text-2xl text-white shadow-xl ring-2 ring-white/20 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-2xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
