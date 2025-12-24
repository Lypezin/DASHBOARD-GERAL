
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInItem } from '@/utils/animations';
import { Calendar } from 'lucide-react';
import { ComparacaoMetrics } from './ComparacaoMetrics';
import { ComparacaoSection } from './ComparacaoSection';
import { ComparacaoSubPracaSection } from './ComparacaoSubPracaSection';
import { ComparacaoOrigemSection } from './ComparacaoOrigemSection';
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

    return (
        <React.Fragment>
            <motion.div variants={fadeInItem}>
                <ComparacaoMetrics dadosComparacao={data.dadosComparacao} />
            </motion.div>

            <motion.div variants={fadeInItem}>
                <ComparacaoDetailedCard
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeDetalhada}
                    onViewModeChange={actions.setViewModeDetalhada}
                />
            </motion.div>

            <motion.div variants={fadeInItem}>
                <ComparacaoDiaTable
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                />
            </motion.div>

            <motion.div variants={fadeInItem}>
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

            <motion.div variants={fadeInItem}>
                <ComparacaoSubPracaSection
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    viewMode={state.viewModeSubPraca}
                    onViewModeChange={actions.setViewModeSubPraca}
                />
            </motion.div>

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
        </React.Fragment>
    );
});
