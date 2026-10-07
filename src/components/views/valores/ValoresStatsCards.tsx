'use client';

import React from 'react';
import { BarChart3, Car, DollarSign, Users } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

interface ValoresStatsCardsProps {
  totalGeral: number;
  totalEntregadores: number;
  totalCorridas: number;
  taxaMediaGeral: number;
  formatarReal: (valor: number | null | undefined) => string;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.03, staggerChildren: 0.035 } },
};

const metricVariants: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

export const ValoresStatsCards = React.memo(function ValoresStatsCards({
  totalGeral,
  totalEntregadores,
  totalCorridas,
  taxaMediaGeral,
  formatarReal,
}: ValoresStatsCardsProps) {
  const reduceMotion = useReducedMotion() ?? true;
  const metrics = [
    { label: 'Total geral', value: formatarReal(totalGeral), meta: 'Soma das taxas', icon: DollarSign },
    { label: 'Entregadores', value: totalEntregadores.toLocaleString('pt-BR'), meta: 'No período selecionado', icon: Users },
    { label: 'Total de corridas', value: totalCorridas.toLocaleString('pt-BR'), meta: 'Corridas aceitas', icon: Car },
    { label: 'Taxa média', value: formatarReal(taxaMediaGeral), meta: 'Por corrida aceita', icon: BarChart3 },
  ];

  return (
    <section aria-labelledby="valores-resumo-title" className="space-y-2.5">
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <h2 id="valores-resumo-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
            Visão do período
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Indicadores dos filtros selecionados</p>
        </div>
      </div>

      <motion.dl
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? undefined : 'visible'}
        variants={reduceMotion ? undefined : containerVariants}
        className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metrics.map(({ label, value, meta, icon: Icon }) => (
          <motion.div
            key={label}
            variants={reduceMotion ? undefined : metricVariants}
            className="min-w-0 border-t-[3px] border-t-[#9ac8de] bg-white px-4 py-3 dark:border-t-sky-700 dark:bg-slate-900 xl:px-5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#347ca3] dark:text-sky-200" aria-hidden="true" />
              <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">{label}</dt>
            </div>
            <dd className="mt-2 min-h-[3.75rem] min-w-0 text-[#173f5a] dark:text-slate-50">
              <span className="block truncate text-[22px] font-semibold leading-7 tracking-tight tabular-nums" title={value}>
                {value}
              </span>
              <span className="mt-1 block truncate text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                {meta}
              </span>
            </dd>
          </motion.div>
        ))}
      </motion.dl>
    </section>
  );
});

ValoresStatsCards.displayName = 'ValoresStatsCards';
