import React from 'react';
import { FilterOption, CurrentUser } from '@/types';
import ApresentacaoView from '@/components/ApresentacaoView';
import { ViewToggleButton } from './ViewToggleButton';

import { useComparacaoViewController } from './comparacao/hooks/useComparacaoViewController';
import { ComparacaoTabelaDetalhada } from './comparacao/ComparacaoTabelaDetalhada';
import { ComparacaoFilters } from './comparacao/ComparacaoFilters';
import { ComparacaoCharts } from './comparacao/ComparacaoCharts';
import { ComparacaoMetrics } from './comparacao/ComparacaoMetrics';
import { ComparacaoSection } from './comparacao/ComparacaoSection';
import { ComparacaoSubPracaSection } from './comparacao/ComparacaoSubPracaSection';
import { ComparacaoOrigemSection } from './comparacao/ComparacaoOrigemSection';
import { ComparacaoUtrSection } from './comparacao/ComparacaoUtrSection';
import { ComparacaoDiaTable } from './comparacao/ComparacaoDiaTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Calendar } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

const ComparacaoView = React.memo(function ComparacaoView(props: {
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: CurrentUser | null;
}) {
  const { state, data, actions } = useComparacaoViewController(props);

  return (
    <div className="space-y-6 animate-fade-in">
      <ComparacaoFilters
        pracas={props.pracas}
        todasSemanas={data.todasSemanas}
        semanasSelecionadas={state.semanasSelecionadas}
        pracaSelecionada={state.pracaSelecionada}
        shouldDisablePracaFilter={state.shouldDisablePracaFilter}
        onPracaChange={actions.setPracaSelecionada}
        onToggleSemana={actions.toggleSemana}
        onClearSemanas={actions.limparSemanas}
        onComparar={actions.compararSemanas}
        onMostrarApresentacao={() => actions.setMostrarApresentacao(true)}
        loading={state.loading}
        dadosComparacaoLength={data.dadosComparacao.length}
      />

      {state.loading && <DashboardSkeleton contentOnly />}

      {!state.loading && data.dadosComparacao.length > 0 && (
        <div className="space-y-6">
          <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    Comparação Detalhada de Métricas
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <ViewToggleButton
                    active={state.viewModeDetalhada === 'table'}
                    onClick={() => actions.setViewModeDetalhada('table')}
                    label="Tabela"
                  />
                  <ViewToggleButton
                    active={state.viewModeDetalhada === 'chart'}
                    onClick={() => actions.setViewModeDetalhada('chart')}
                    label="Gráfico"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {state.viewModeDetalhada === 'table' ? (
                <ComparacaoTabelaDetalhada
                  dadosComparacao={data.dadosComparacao}
                  semanasSelecionadas={state.semanasSelecionadas}
                />
              ) : (
                <ComparacaoCharts
                  dadosComparacao={data.dadosComparacao}
                  semanasSelecionadas={state.semanasSelecionadas}
                  viewMode={state.viewModeDetalhada}
                  chartType="detalhada"
                />
              )}
            </CardContent>
          </Card>

          <ComparacaoDiaTable
            dadosComparacao={data.dadosComparacao}
            semanasSelecionadas={state.semanasSelecionadas}
          />

          <ComparacaoSection
            title="Aderência por Dia da Semana"
            icon={<Calendar className="h-5 w-5 text-blue-500" />}
            description="Performance de aderência distribuída pelos dias da semana"
            type="dia"
            dadosComparacao={data.dadosComparacao}
            semanasSelecionadas={state.semanasSelecionadas}
            viewMode={state.viewModeDia}
            onViewModeChange={actions.setViewModeDia}
          />
          <ComparacaoSubPracaSection
            dadosComparacao={data.dadosComparacao}
            semanasSelecionadas={state.semanasSelecionadas}
            viewMode={state.viewModeSubPraca}
            onViewModeChange={actions.setViewModeSubPraca}
          />

          <ComparacaoOrigemSection
            dadosComparacao={data.dadosComparacao}
            semanasSelecionadas={state.semanasSelecionadas}
            viewMode={state.viewModeOrigem}
            onViewModeChange={actions.setViewModeOrigem}
            origensDisponiveis={data.origensDisponiveis}
            totalColunasOrigem={data.totalColunasOrigem}
          />

          <ComparacaoUtrSection
            utrComparacao={data.utrComparacao}
            semanasSelecionadas={state.semanasSelecionadas}
          />
        </div>
      )}

      {state.mostrarApresentacao && (
        <ApresentacaoView
          dadosComparacao={data.dadosComparacao}
          semanasSelecionadas={state.semanasSelecionadas}
          pracaSelecionada={state.pracaSelecionada}
          onClose={() => actions.setMostrarApresentacao(false)}
        />
      )}
    </div>
  );
});

ComparacaoView.displayName = 'ComparacaoView';

export default ComparacaoView;
