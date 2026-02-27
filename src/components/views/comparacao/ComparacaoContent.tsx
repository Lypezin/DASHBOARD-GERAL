
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInItem, staggerContainer } from '@/utils/animations';
import { Calendar } from 'lucide-react';
import { ComparacaoMetrics } from './ComparacaoMetrics';
import { ComparacaoSection } from './ComparacaoSection';
import { ComparacaoSubPracaSection } from './ComparacaoSubPracaSection';
import { ComparacaoOrigemSection } from './ComparacaoOrigemSection';
import { ComparacaoOrigemDetalhada } from './ComparacaoOrigemDetalhada';
import { ComparacaoUtrSection } from './ComparacaoUtrSection';
import { ComparacaoDiaTable } from './ComparacaoDiaTable';
import { ComparacaoDetailedCard } from './ComparacaoDetailedCard';

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

    const sv = state.secoesVisiveis;

    return (
        <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
            {/* KPI Cards */}
            {sv.metricas && (
                <motion.div variants={fadeInItem}>
                    <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />
                </motion.div>
            )}

            {/* Detailed Analysis */}
            {sv.detalhada && (
                <motion.div variants={fadeInItem}>
                    <ComparacaoDetailedCard
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeDetalhada}
                        onViewModeChange={actions.setViewModeDetalhada}
                    />
                </motion.div>
            )}

            {/* Daily */}
            {sv.por_dia && (
                <motion.div variants={fadeInItem}>
                    <ComparacaoDiaTable
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                    />
                </motion.div>
            )}

            {/* Stacked: Day + Sub-Praça */}
            {sv.aderencia_dia && (
                <motion.div variants={fadeInItem}>
                    <ComparacaoSection
                        title="Aderência por Dia"
                        icon={<Calendar className="h-5 w-5" />}
                        description=""
                        type="dia"
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeDia}
                        onViewModeChange={actions.setViewModeDia}
                    />
                </motion.div>
            )}

            {sv.sub_praca && (
                <motion.div variants={fadeInItem}>
                    <ComparacaoSubPracaSection
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                        viewMode={state.viewModeSubPraca}
                        onViewModeChange={actions.setViewModeSubPraca}
                    />
                </motion.div>
            )}

            {/* Origem */}
            {sv.por_origem && (
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
            )}

            {/* Análise Detalhada por Origem */}
            {sv.origem_detalhada && (
                <motion.div variants={fadeInItem}>
                    <ComparacaoOrigemDetalhada
                        dadosComparacao={data.dadosComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                    />
                </motion.div>
            )}

            {/* UTR */}
            {sv.utr && (
                <motion.div variants={fadeInItem}>
                    <ComparacaoUtrSection
                        utrComparacao={data.utrComparacao}
                        semanasSelecionadas={state.semanasSelecionadas}
                    />
                </motion.div>
            )}
        </motion.div>
    );
});
