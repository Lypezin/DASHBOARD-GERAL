import React from 'react';

function MetricCard({ 
  title, 
  value, 
  icon, 
  percentage,
  percentageLabel,
  color = 'blue'
}: { 
  title: string; 
  value: number; 
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
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/90 backdrop-blur-sm p-5 sm:p-6 lg:p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/90">
      <div className={`absolute right-0 top-0 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10 blur-3xl transition-opacity group-hover:opacity-25`}></div>
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 transition-transform group-hover:scale-105 dark:text-white">{value.toLocaleString('pt-BR')}</p>
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
        <div className={`flex h-14 w-14 sm:h-16 sm:w-16 lg:h-18 lg:w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClasses[color]} text-2xl sm:text-3xl lg:text-4xl text-white shadow-xl ring-2 ring-white/20 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
