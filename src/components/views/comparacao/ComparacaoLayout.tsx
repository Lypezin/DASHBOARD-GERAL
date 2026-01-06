
import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInItem } from '@/utils/animations';
import { Calendar } from 'lucide-react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import ApresentacaoView from '@/components/ApresentacaoView';
import { ComparacaoFilters } from './ComparacaoFilters';
import { ComparacaoContent } from './ComparacaoContent';
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


    return (
        <motion.div
            className="space-y-6 pb-6"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={fadeInItem}>
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

            {!state.loading && (
                <ComparacaoContent
                    data={data}
                    state={state}
                    actions={actions}
                />
            )}

            {state.mostrarApresentacao && (
                <ApresentacaoView
                    dadosComparacao={data.dadosComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    pracaSelecionada={state.pracaSelecionada}
                    anoSelecionado={state.anoSelecionado}
                    onClose={() => actions.setMostrarApresentacao(false)}
                />
            )}
        </motion.div>
    );
});
