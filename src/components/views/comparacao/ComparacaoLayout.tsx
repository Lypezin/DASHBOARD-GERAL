import React from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import ApresentacaoView from '@/components/ApresentacaoView';
import { ComparacaoFilters } from './ComparacaoFilters';
import { ComparacaoContent } from './ComparacaoContent';
import { FilterOption } from '@/types';
import { ViewContainer } from '@/components/layout/ViewContainer';

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
    const shouldReduceMotion = useReducedMotion();
    const hasComparisonData = data.dadosComparacao.length > 0 || data.utrComparacao.length > 0;
    const motionProps = {
        initial: shouldReduceMotion ? false : { opacity: 0, y: 8 },
        animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
        exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 },
        transition: { duration: shouldReduceMotion ? 0.01 : 0.15, ease: [0.22, 1, 0.36, 1] },
    } as const;

    return (
        <ViewContainer className="space-y-8 pb-8">
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
                dadosComparacao={data.dadosComparacao}
                utrComparacao={data.utrComparacao}
                secoesVisiveis={state.secoesVisiveis}
                onToggleSecao={actions.toggleSecao}
            />

            <AnimatePresence mode="wait" initial={false}>
                {state.loading && !hasComparisonData ? (
                    <motion.div key="comparacao-loading" {...motionProps} className="min-w-0">
                        <DashboardSkeleton contentOnly />
                    </motion.div>
                ) : state.error && !hasComparisonData ? (
                    <motion.div
                        key="comparacao-error"
                        {...motionProps}
                        className="rounded-[2rem] border border-rose-200/70 bg-white/95 px-4 py-16 text-center shadow-[0_20px_60px_-44px_rgba(190,24,93,0.35)] dark:border-rose-900/40 dark:bg-slate-950/80"
                    >
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100/90 dark:bg-rose-950/50">
                            <AlertCircle className="h-8 w-8 text-rose-500 dark:text-rose-300" />
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                            Erro ao carregar comparação
                        </h2>
                        <p className="mx-auto max-w-md leading-relaxed text-slate-500 dark:text-slate-400">
                            {state.error}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 rounded-full bg-rose-500 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-rose-500/20 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-rose-600"
                        >
                            Tentar novamente
                        </button>
                    </motion.div>
                ) : state.semanasSelecionadas.length > 2 ? (
                    <motion.div
                        key="comparacao-limit"
                        {...motionProps}
                        className="rounded-[2rem] border border-slate-200/80 bg-white/95 px-4 py-20 text-center shadow-[0_24px_70px_-50px_rgba(15,23,42,0.34)] dark:border-slate-800/80 dark:bg-slate-950/80"
                    >
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/30">
                            <Calendar className="h-10 w-10 text-sky-500 dark:text-sky-300" />
                        </div>
                        <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Limite de comparação excedido
                        </h2>
                        <p className="mx-auto mb-8 max-w-md leading-relaxed text-slate-500 dark:text-slate-400">
                            Para manter leitura e precisão, a aba de comparação suporta no máximo <span className="font-bold text-sky-600 dark:text-sky-300">2 semanas</span> simultâneas.
                        </p>
                        <button
                            onClick={actions.limparSemanas}
                            className="rounded-full bg-slate-900 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-md shadow-slate-900/10 transition-[background-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 dark:bg-white dark:text-slate-900 dark:shadow-white/5"
                        >
                            Reajustar seleção
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`comparacao-content-${state.semanasSelecionadas.join('-')}-${state.pracaSelecionada || 'todas'}`}
                        {...motionProps}
                        className="min-w-0"
                    >
                        {state.loading ? (
                            <div className="mb-4 rounded-2xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm font-semibold text-sky-800 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-200">
                                Atualizando comparacao com os filtros atuais...
                            </div>
                        ) : null}
                        {state.error ? (
                            <div className="mb-4 rounded-2xl border border-amber-200/70 bg-amber-50/85 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
                                Nao foi possivel atualizar todos os dados da comparacao. Exibindo a ultima resposta valida.
                            </div>
                        ) : null}
                        <ComparacaoContent
                            data={data}
                            state={state}
                            actions={actions}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

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
        </ViewContainer>
    );
});
