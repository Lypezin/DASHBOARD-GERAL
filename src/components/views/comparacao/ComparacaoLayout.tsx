
import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInItem } from '@/utils/animations';
import { Calendar, AlertCircle } from 'lucide-react';
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
            className="space-y-8 pb-8 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8"
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
                    onMostrarApresentacao={() => actions.setMostrarApresentacao(true)}
                    loading={state.loading}
                    dadosComparacaoLength={data.dadosComparacao.length}
                    secoesVisiveis={state.secoesVisiveis}
                    onToggleSecao={actions.toggleSecao}
                />
            </motion.div>

            {state.loading && <DashboardSkeleton contentOnly />}

            {state.error && !state.loading && (
                <motion.div 
                    variants={fadeInItem}
                    className="flex flex-col items-center justify-center py-16 px-4 text-center bg-rose-50/50 dark:bg-rose-950/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30 shadow-sm"
                >
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-5">
                        <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Erro ao carregar comparação
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        {state.error}
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
                    >
                        Tentar Novamente
                    </button>
                </motion.div>
            )}

            {!state.loading && state.semanasSelecionadas.length > 2 && (
                <motion.div 
                    variants={fadeInItem}
                    className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-transparent dark:border-slate-800/50"
                >
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                        <Calendar className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                        Limite de Comparação Excedido
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
                        Para garantir a melhor visualização e precisão dos dados, a aba de comparação suporta no máximo <span className="font-bold text-indigo-600 dark:text-indigo-400">2 semanas</span> simultâneas.
                    </p>
                    <button 
                        onClick={actions.limparSemanas}
                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                    >
                        Reajustar Seleção
                    </button>
                </motion.div>
            )}

            {!state.loading && state.semanasSelecionadas.length <= 2 && (
                <ComparacaoContent
                    data={data}
                    state={state}
                    actions={actions}
                />
            )}

            {state.mostrarApresentacao && (
                <ApresentacaoView
                    dadosComparacao={data.dadosComparacao}
                    utrComparacao={data.utrComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    pracaSelecionada={state.pracaSelecionada}
                    anoSelecionado={state.anoSelecionado}
                    onClose={() => actions.setMostrarApresentacao(false)}
                    onPracaChange={actions.setPracaSelecionada}
                    onSemanasChange={actions.setSemanasSelecionadas}
                />
            )}
        </motion.div>
    );
});
