import React from 'react';
import { DollarSign, Users, Car, BarChart3 } from 'lucide-react';
import { SaasMetric } from '@/components/views/shared/SaasPrimitives';

interface ValoresStatsCardsProps {
  totalGeral: number;
  totalEntregadores: number;
  totalCorridas: number;
  taxaMediaGeral: number;
  formatarReal: (valor: number | null | undefined) => string;
}

export const ValoresStatsCards = React.memo(function ValoresStatsCards({
  totalGeral, totalEntregadores, totalCorridas, taxaMediaGeral, formatarReal,
}: ValoresStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SaasMetric
        label="Total geral"
        value={formatarReal(totalGeral)}
        meta="Soma de todas as taxas"
        icon={DollarSign}
        tone="emerald"
        size="lg"
        className="p-5"
      />
      <SaasMetric
        label="Entregadores"
        value={totalEntregadores.toLocaleString('pt-BR')}
        meta="Total de entregadores listados"
        icon={Users}
        tone="blue"
        size="lg"
        className="p-5"
      />
      <SaasMetric
        label="Total de corridas"
        value={totalCorridas.toLocaleString('pt-BR')}
        meta="Corridas aceitas no período"
        icon={Car}
        tone="blue"
        size="lg"
        className="p-5"
      />
      <SaasMetric
        label="Taxa média"
        value={formatarReal(taxaMediaGeral)}
        meta="Valor médio por corrida"
        icon={BarChart3}
        tone="slate"
        size="lg"
        className="p-5"
      />
    </div>
  );
});
