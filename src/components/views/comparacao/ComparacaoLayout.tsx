import React from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
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
        <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 pb-8 animate-fade-in sm:px-6 lg:px-8">
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

            {state.loading && <DashboardSkeleton contentOnly />}

            {state.error && !state.loading && (
                <div className="animate-fade-in rounded-[2rem] border border-rose-200/70 bg-white/95 px-4 py-16 text-center shadow-[0_20px_60px_-44px_rgba(190,24,93,0.35)] dark:border-rose-900/40 dark:bg-slate-950/80">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100/90 dark:bg-rose-950/50">
                        <AlertCircle className="h-8 w-8 text-rose-500 dark:text-rose-300" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                        Erro ao carregar comparacao
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
                </div>
            )}

            {!state.loading && state.semanasSelecionadas.length > 2 && (
                <div className="animate-fade-in rounded-[2rem] border border-slate-200/80 bg-white/95 px-4 py-20 text-center shadow-[0_24px_70px_-50px_rgba(15,23,42,0.34)] dark:border-slate-800/80 dark:bg-slate-950/80">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/30">
                        <Calendar className="h-10 w-10 text-sky-500 dark:text-sky-300" />
                    </div>
                    <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Limite de comparacao excedido
                    </h2>
                    <p className="mx-auto mb-8 max-w-md leading-relaxed text-slate-500 dark:text-slate-400">
                        Para manter leitura e precisao, a aba de comparacao suporta no maximo <span className="font-bold text-sky-600 dark:text-sky-300">2 semanas</span> simultaneas.
                    </p>
                    <button
                        onClick={actions.limparSemanas}
                        className="rounded-full bg-slate-900 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-md shadow-slate-900/10 transition-[background-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 dark:bg-white dark:text-slate-900 dark:shadow-white/5"
                    >
                        Reajustar selecao
                    </button>
                </div>
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
        </div>
    );
});
