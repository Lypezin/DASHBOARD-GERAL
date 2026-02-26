
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInItem, staggerContainer } from '@/utils/animations';
import { Calendar, TrendingUp } from 'lucide-react';
import { ComparacaoMetrics } from './ComparacaoMetrics';
import { ComparacaoSection } from './ComparacaoSection';
import { ComparacaoSubPracaSection } from './ComparacaoSubPracaSection';
import { ComparacaoOrigemSection } from './ComparacaoOrigemSection';
import { ComparacaoUtrSection } from './ComparacaoUtrSection';
import { ComparacaoDiaTable } from './ComparacaoDiaTable';
import { ComparacaoDetailedCard } from './ComparacaoDetailedCard';
import { SectionCard } from './components/SectionCard';

interface ComparacaoContentProps {
    data: any;
    state: any;
    actions: any;
}

export const ComparacaoContent = React.memo(function ComparacaoContent({
    data,
    state,
    actions
}: ComparacaoContentProps) {
    if (data.dadosComparacao.length === 0) return null;

    return (
        <motion.div
            className="space-y-5"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
            {/* Hero Metrics — KPI Cards */}
            <motion.div variants={fadeInItem}>
                <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />
            </motion.div>

            {/* Detailed Analysis — Table/Chart toggle */}
            <motion.div variants={fadeInItem}>
                <ComparacaoDetailedCard
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeDetalhada}
                    onViewModeChange={actions.setViewModeDetalhada}
                />
            </motion.div>

            {/* Daily Breakdown Table */}
            <motion.div variants={fadeInItem}>
                <SectionCard
                    title="Detalhamento Diário"
                    description="Performance de aderência dia a dia por semana"
                    accentColor="bg-emerald-500"
                    noPadding
                >
                    <ComparacaoDiaTable
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                    />
                </SectionCard>
            </motion.div>

            {/* Two-column: Day of Week + Sub-Praça */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <motion.div variants={fadeInItem}>
                    <ComparacaoSection
                        title="Aderência por Dia"
                        icon={<Calendar className="h-5 w-5" />}
                        description="Performance por dia da semana"
                        type="dia"
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeDia}
                        onViewModeChange={actions.setViewModeDia}
                    />
                </motion.div>

                <motion.div variants={fadeInItem}>
                    <ComparacaoSubPracaSection
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeSubPraca}
                        onViewModeChange={actions.setViewModeSubPraca}
                    />
                </motion.div>
            </div>

            {/* Full Width: Origem */}
            <motion.div variants={fadeInItem}>
                <ComparacaoOrigemSection
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeOrigem}
                    onViewModeChange={actions.setViewModeOrigem}
                    origensDisponiveis={data.origensDisponiveis}
                    totalColunasOrigem={data.totalColunasOrigem}
                />
            </motion.div>

            {/* UTR with Ring Charts */}
            <motion.div variants={fadeInItem}>
                <ComparacaoUtrSection
                    utrComparacao={data.utrComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </motion.div>
        </motion.div>
    );
});
