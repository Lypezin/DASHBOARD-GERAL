import React from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, Calendar } from 'lucide-react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ComparacaoFilters } from './ComparacaoFilters';
import { ComparacaoContent } from './ComparacaoContent';
import { FilterOption } from '@/types';
import { ViewContainer } from '@/components/layout/ViewContainer';
import { ViewTransition } from '@/components/ui/view-transition';

const ApresentacaoView = dynamic(() => import('@/components/ApresentacaoView'), {
    ssr: false,
    loading: () => <DashboardSkeleton contentOnly />,
});

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
    const hasComparisonData = data.dadosComparacao.length > 0 || data.utrComparacao.some((item: { utr: unknown }) => item.utr !== null);
    const comparisonStateKey = state.loading && !hasComparisonData
        ? 'loading'
        : (state.error || data.utrError) && !hasComparisonData
            ? 'error'
            : state.semanasSelecionadas.length > 2
                ? 'limit'
                : state.semanasSelecionadas.length < 2
                    ? 'selection-needed'
                    : hasComparisonData
                        ? 'content'
                        : 'empty';
    const contentState = React.useMemo(() => ({
        secoesVisiveis: state.secoesVisiveis,
        semanasSelecionadas: state.semanasSelecionadas,
        viewModeDetalhada: state.viewModeDetalhada,
        viewModeDia: state.viewModeDia,
        viewModeSubPraca: state.viewModeSubPraca,
        viewModeOrigem: state.viewModeOrigem,
    }), [
        state.secoesVisiveis,
        state.semanasSelecionadas,
        state.viewModeDetalhada,
        state.viewModeDia,
        state.viewModeSubPraca,
        state.viewModeOrigem,
    ]);
    const contentActions = React.useMemo(() => ({
        setViewModeDetalhada: actions.setViewModeDetalhada,
        setViewModeDia: actions.setViewModeDia,
        setViewModeSubPraca: actions.setViewModeSubPraca,
        setViewModeOrigem: actions.setViewModeOrigem,
        retryData: actions.retryData,
    }), [
        actions.setViewModeDetalhada,
        actions.setViewModeDia,
        actions.setViewModeSubPraca,
        actions.setViewModeOrigem,
        actions.retryData,
    ]);
    return (
        <ViewContainer className="space-y-5 pb-10 pt-4">
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
                error={state.error}
                dadosComparacao={data.dadosComparacao}
                utrComparacao={data.utrComparacao}
                secoesVisiveis={state.secoesVisiveis}
                onToggleSecao={actions.toggleSecao}
                loadingSemanas={state.loadingSemanas}
                errorSemanas={state.errorSemanas}
                onRetrySemanas={actions.retrySemanas}
            />

            <ViewTransition stateKey={comparisonStateKey} preventExitInteraction>
                {state.loading && !hasComparisonData ? (
                    <div className="min-w-0">
                        <DashboardSkeleton contentOnly />
                    </div>
                ) : (state.error || data.utrError) && !hasComparisonData ? (
                    <div
                        className="rounded-xl border border-rose-200 bg-white px-4 py-12 text-center dark:border-rose-900/40 dark:bg-slate-950/80"
                    >
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40">
                            <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-300" />
                        </div>
                        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                            {state.error ? 'Erro ao carregar comparação' : 'Erro ao carregar UTR'}
                        </h2>
                        <p className="mx-auto max-w-md leading-relaxed text-slate-500 dark:text-slate-400">
                            {state.error || data.utrError}
                        </p>
                        <button
                            onClick={actions.retryData}
                            className="mt-5 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : state.semanasSelecionadas.length > 2 ? (
                    <div
                        className="rounded-xl border border-[#d8e4eb] bg-white px-4 py-14 text-center dark:border-slate-800 dark:bg-slate-950/80"
                    >
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30">
                            <Calendar className="h-6 w-6 text-[#38708e] dark:text-sky-300" />
                        </div>
                        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                            Limite de comparação excedido
                        </h2>
                        <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                            Para manter a leitura clara, compare até <span className="font-semibold text-[#285d79] dark:text-sky-200">2 semanas</span> por vez.
                        </p>
                        <button
                            onClick={actions.limparSemanas}
                            className="rounded-lg bg-[#174d70] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#103c59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38708e] focus-visible:ring-offset-2 dark:bg-white dark:text-[#174d70] dark:hover:bg-slate-100"
                        >
                            Reajustar seleção
                        </button>
                    </div>
                ) : state.semanasSelecionadas.length < 2 ? (
                    <div
                        className="rounded-xl border border-[#d8e4eb] bg-white px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-950/80"
                    >
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/30">
                            <Calendar className="h-6 w-6 text-[#38708e] dark:text-sky-300" />
                        </div>
                        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                            Selecione duas semanas para comparar
                        </h2>
                        <p className="mx-auto max-w-md leading-relaxed text-slate-500 dark:text-slate-400">
                            Use o filtro de semanas acima e escolha dois períodos para carregar os indicadores e as tabelas.
                        </p>
                    </div>
                ) : !hasComparisonData ? (
                    <div
                        className="rounded-xl border border-[#d8e4eb] bg-white px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-950/80"
                    >
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <Calendar className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                        </div>
                        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                            Nenhum dado encontrado para essa combinação
                        </h2>
                        <p className="mx-auto max-w-md leading-relaxed text-slate-500 dark:text-slate-400">
                            Tente outras semanas ou selecione outra praça nos filtros acima.
                        </p>
                    </div>
                ) : (
                    <div
                        className="min-w-0"
                    >
                        {state.loading ? (
                            <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-200">
                                Atualizando comparação com os filtros atuais...
                            </div>
                        ) : null}
                                {state.error ? (
                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
                                Não foi possível atualizar todos os dados da comparação. Exibindo a última resposta válida.
                            </div>
                        ) : null}
                        <ComparacaoContent
                            data={data}
                            state={contentState}
                            actions={contentActions}
                        />
                    </div>
                )}
            </ViewTransition>

            {state.mostrarApresentacao && !state.loading && !state.error && data.dadosComparacao.length === 2 && (
                <ApresentacaoView
                    dadosComparacao={data.dadosComparacao}
                    utrComparacao={data.utrComparacao}
                    semanasSelecionadas={state.semanasSelecionadas}
                    pracaSelecionada={state.pracaSelecionada}
                    anoSelecionado={state.anoSelecionado}
                    dimensionFilters={data.dimensionFilters}
                    onClose={() => actions.setMostrarApresentacao(false)}
                    onPracaChange={actions.setPracaSelecionada}
                    onSemanasChange={actions.setSemanasSelecionadas}
                />
            )}
        </ViewContainer>
    );
});
