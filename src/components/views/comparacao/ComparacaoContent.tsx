
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
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
            {/* Hero Metrics */}
            <motion.div variants={fadeInItem}>
                <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />
            </motion.div>

            {/* Detailed Analysis Card */}
            <motion.div variants={fadeInItem}>
                <ComparacaoDetailedCard
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeDetalhada}
                    onViewModeChange={actions.setViewModeDetalhada}
                />
            </motion.div>

            {/* Daily Comparison Table */}
            <motion.div variants={fadeInItem}>
                <SectionCard
                    title="Comparativo por Semana"
                    description="Análise detalhada das métricas semanais"
                    icon={<TrendingUp className="h-5 w-5" />}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    noPadding
                >
                    <ComparacaoDiaTable
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                    />
                </SectionCard>
            </motion.div>

            {/* Grid Layout for Analysis Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Day of Week Section */}
                <motion.div variants={fadeInItem}>
                    <ComparacaoSection
                        title="Aderência por Dia"
                        icon={<Calendar className="h-5 w-5" />}
                        description="Performance distribuída pelos dias da semana"
                        type="dia"
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeDia}
                        onViewModeChange={actions.setViewModeDia}
                    />
                </motion.div>

                {/* Sub-praça Section */}
                <motion.div variants={fadeInItem}>
                    <ComparacaoSubPracaSection
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeSubPraca}
                        onViewModeChange={actions.setViewModeSubPraca}
                    />
                </motion.div>
            </div>

            {/* Full Width Sections */}
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

            <motion.div variants={fadeInItem}>
                <ComparacaoUtrSection
                    utrComparacao={data.utrComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </motion.div>
        </motion.div>
    );
});
