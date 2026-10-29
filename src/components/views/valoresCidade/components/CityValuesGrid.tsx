import React from 'react';
import { MapPin } from 'lucide-react';
import { ValoresCidadePorCidade } from '@/types';

interface CityValuesGridProps {
  cidadesData: ValoresCidadePorCidade[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value);

export const CityValuesGrid: React.FC<CityValuesGridProps> = ({ cidadesData }) => (
  <section aria-labelledby="valores-por-praca-title" className="space-y-2.5">
    <header className="flex items-end justify-between gap-3 px-0.5">
      <div>
        <h2 id="valores-por-praca-title" className="text-[15px] font-semibold tracking-tight text-[#183f58] dark:text-slate-100">
          Investimento por praça
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Valor total enviado em cada cidade</p>
      </div>
      <span className="hidden text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400 sm:block">
        {cidadesData.length} {cidadesData.length === 1 ? 'praça' : 'praças'}
      </span>
    </header>

    {cidadesData.length === 0 ? (
      <div className="rounded-xl border border-dashed border-[#d8e4eb] bg-white px-5 py-10 text-center dark:border-slate-800 dark:bg-slate-950/70">
        <MapPin className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">Nenhum dado encontrado para o período selecionado.</p>
      </div>
    ) : (
      <dl className="grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#d8e4eb] bg-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 xl:grid-cols-3">
        {cidadesData.map((cidadeData) => (
          <div key={cidadeData.cidade} className="min-w-0 border-t-[3px] border-t-[#9ac8de] bg-white px-4 py-3 dark:border-t-sky-700 dark:bg-slate-900">
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#347ca3] dark:text-sky-200" aria-hidden="true" />
              <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-300" title={cidadeData.cidade}>{cidadeData.cidade}</dt>
            </div>
            <dd className="mt-2 min-w-0 truncate text-[20px] font-semibold leading-7 tracking-tight tabular-nums text-[#173f5a] dark:text-slate-50" title={formatCurrency(cidadeData.valor_total)}>
              {formatCurrency(cidadeData.valor_total)}
            </dd>
          </div>
        ))}
      </dl>
    )}
  </section>
);
