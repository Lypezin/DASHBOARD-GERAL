import React from 'react';
import { MapPin } from 'lucide-react';
import { SaasMetric, SaasPanel } from '@/components/views/shared/SaasPrimitives';
import { ValoresCidadePorCidade } from '@/types';

interface CityValuesGridProps {
  cidadesData: ValoresCidadePorCidade[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value);

export const CityValuesGrid: React.FC<CityValuesGridProps> = ({ cidadesData }) => (
  <section aria-labelledby="valores-por-praca-title" className="space-y-3">
    <div className="flex items-end justify-between gap-3 px-0.5">
      <div>
        <h2 id="valores-por-praca-title" className="text-sm font-semibold text-slate-800 dark:text-slate-100">Investimento por praça</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Valor total enviado em cada cidade</p>
      </div>
      <span className="hidden text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400 sm:block">
        {cidadesData.length} {cidadesData.length === 1 ? 'praça' : 'praças'}
      </span>
    </div>

    {cidadesData.length === 0 ? (
      <SaasPanel className="px-5 py-10 text-center">
        <MapPin className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">Nenhum dado encontrado para o período selecionado.</p>
      </SaasPanel>
    ) : (
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cidadesData.map((cidadeData) => (
          <SaasMetric
            key={cidadeData.cidade}
            label={cidadeData.cidade}
            value={formatCurrency(cidadeData.valor_total)}
            icon={MapPin}
            tone="blue"
            size="lg"
            className="rounded-xl px-4 py-3"
          />
        ))}
      </div>
    )}
  </section>
);
