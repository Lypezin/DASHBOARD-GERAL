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

const Section = ({ show, children }: { show: boolean, children: React.ReactNode }) => {
    if (!show) return null;
    return <motion.div variants={fadeInItem}>{children}</motion.div>;
};

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
            <Section show={sv.metricas}>
                <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />
            </Section>

            {/* Detailed Analysis */}
            <Section show={sv.detalhada}>
                <ComparacaoDetailedCard
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeDetalhada}
                    onViewModeChange={actions.setViewModeDetalhada}
                />
            </Section>

            {/* Daily */}
            <Section show={sv.por_dia}>
                <ComparacaoDiaTable
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </Section>

            {/* Stacked: Day + Sub-Praça */}
            <Section show={sv.aderencia_dia}>
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
            </Section>

            <Section show={sv.sub_praca}>
                <ComparacaoSubPracaSection
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeSubPraca}
                    onViewModeChange={actions.setViewModeSubPraca}
                />
            </Section>

            {/* Origem */}
            <Section show={sv.por_origem}>
                <ComparacaoOrigemSection
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeOrigem}
                    onViewModeChange={actions.setViewModeOrigem}
                    origensDisponiveis={data.origensDisponiveis}
                    totalColunasOrigem={data.totalColunasOrigem}
                />
            </Section>

            {/* Análise Detalhada por Origem */}
            <Section show={sv.origem_detalhada}>
                <ComparacaoOrigemDetalhada
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </Section>

            {/* UTR */}
            <Section show={sv.utr}>
                <ComparacaoUtrSection
                    utrComparacao={data.utrComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </Section>
        </motion.div>
    );
});
