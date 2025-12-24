
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import ApresentacaoView from '@/components/ApresentacaoView';
import { ComparacaoFilters } from './ComparacaoFilters';
import { ComparacaoMetrics } from './ComparacaoMetrics';
import { ComparacaoSection } from './ComparacaoSection';
import { ComparacaoSubPracaSection } from './ComparacaoSubPracaSection';
import { ComparacaoOrigemSection } from './ComparacaoOrigemSection';
import { ComparacaoUtrSection } from './ComparacaoUtrSection';
import { ComparacaoDiaTable } from './ComparacaoDiaTable';
import { ComparacaoDetailedCard } from './ComparacaoDetailedCard';
import { FilterOption } from '@/types';

interface ComparacaoLayoutProps {
    pracas: FilterOption[];
    state: any;
    data: any;
    actions: any;
}

export const ComparacaoLayout = React.memo(function ComparacaoLayout({
    pracas,
    state,
    data,
    actions
}: ComparacaoLayoutProps) {
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
                    pracas={pracas}
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
                        <ComparacaoDetailedCard
                            dadosComparacao={data.dadosComparacao}
                            semanasSelecionadas={state.semanasSelecionadas}
                            viewMode={state.viewModeDetalhada}
                            onViewModeChange={actions.setViewModeDetalhada}
                        />
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
