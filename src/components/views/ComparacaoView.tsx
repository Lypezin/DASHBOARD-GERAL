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
import { motion, Variants } from 'framer-motion';

const ComparacaoView = React.memo(function ComparacaoView(props: {
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: CurrentUser | null;
}) {
  const { state, data, actions } = useComparacaoViewController(props);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="space-y-6 pb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
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
      </motion.div>

      {state.loading && <DashboardSkeleton contentOnly />}

      {!state.loading && data.dadosComparacao.length > 0 && (
        <React.Fragment>
          <motion.div variants={item}>
            <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 lg:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
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
          </motion.div>

          <motion.div variants={item}>
            <ComparacaoDiaTable
              dadosComparacao={data.dadosComparacao}
              semanasSelecionadas={state.semanasSelecionadas}
            />
          </motion.div>

          <motion.div variants={item}>
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
          </motion.div>

          <motion.div variants={item}>
            <ComparacaoSubPracaSection
              dadosComparacao={data.dadosComparacao}
              semanasSelecionadas={state.semanasSelecionadas}
              viewMode={state.viewModeSubPraca}
              onViewModeChange={actions.setViewModeSubPraca}
            />
          </motion.div>

          <motion.div variants={item}>
            <ComparacaoOrigemSection
              dadosComparacao={data.dadosComparacao}
              semanasSelecionadas={state.semanasSelecionadas}
              viewMode={state.viewModeOrigem}
              onViewModeChange={actions.setViewModeOrigem}
              origensDisponiveis={data.origensDisponiveis}
              totalColunasOrigem={data.totalColunasOrigem}
            />
          </motion.div>

          <motion.div variants={item}>
            <ComparacaoUtrSection
              utrComparacao={data.utrComparacao}
              semanasSelecionadas={state.semanasSelecionadas}
            />
          </motion.div>
        </React.Fragment>
      )}

      {state.mostrarApresentacao && (
        <ApresentacaoView
          dadosComparacao={data.dadosComparacao}
          semanasSelecionadas={state.semanasSelecionadas}
          pracaSelecionada={state.pracaSelecionada}
          onClose={() => actions.setMostrarApresentacao(false)}
        />
      )}
    </motion.div>
  );
});

ComparacaoView.displayName = 'ComparacaoView';

export default ComparacaoView;
