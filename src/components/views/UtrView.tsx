import React, { useMemo } from 'react';
import { UtrData } from '@/types';
import {
  Building2,
  MapPin,
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { UtrGeral } from './utr/UtrGeral';
import { UtrSection } from './utr/UtrSection';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const UtrView = React.memo(function UtrView({
  utrData,
  loading,
}: {
  utrData: UtrData | null;
  loading: boolean;
}) {
  // Hooks devem ser chamados antes de qualquer early return
  const porPraca = useMemo(() => utrData?.praca || utrData?.por_praca || [], [utrData?.praca, utrData?.por_praca]);
  const porSubPraca = useMemo(() => utrData?.sub_praca || utrData?.por_sub_praca || [], [utrData?.sub_praca, utrData?.por_sub_praca]);
  const porOrigem = useMemo(() => utrData?.origem || utrData?.por_origem || [], [utrData?.origem, utrData?.por_origem]);
  const porTurno = useMemo(() => utrData?.turno || utrData?.por_turno || [], [utrData?.turno, utrData?.por_turno]);

  if (loading) {
    if (loading) {
      return (
        <div className="space-y-6 animate-fade-in">
          <TableSkeleton rows={6} columns={4} />
        </div>
      );
    }
  }

  if (!utrData || !utrData.geral) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-700">
        <Activity className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhum dado disponível</p>
        <p className="text-sm text-slate-500">Aguarde o carregamento ou ajuste os filtros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* UTR Geral */}
      <UtrGeral data={utrData.geral} />

      {/* UTR por Praça */}
      <UtrSection
        title="UTR por Praça"
        description="Análise por praça operacional"
        icon={<Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
        data={porPraca}
        getLabel={(item) => item.praca}
      />

      {/* UTR por Sub-Praça */}
      <UtrSection
        title="UTR por Sub-Praça"
        description="Análise por sub-praça operacional"
        icon={<MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
        data={porSubPraca}
        getLabel={(item) => item.sub_praca}
      />

      {/* UTR por Origem */}
      <UtrSection
        title="UTR por Origem"
        description="Análise por origem operacional"
        icon={<Target className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
        data={porOrigem}
        getLabel={(item) => item.origem}
      />

      {/* UTR por Turno */}
      <UtrSection
        title="UTR por Turno"
        description="Análise por turno operacional"
        icon={<Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
        data={porTurno}
        getLabel={(item) => item.turno || item.periodo || ''}
        gridCols="md:grid-cols-2 lg:grid-cols-4"
      />
    </div>
  );
});

UtrView.displayName = 'UtrView';

export default UtrView;
