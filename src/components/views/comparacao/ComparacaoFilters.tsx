import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/shared/filters/FiltroSelect';
import { Presentation, X } from 'lucide-react';
import { ComparacaoWeekSelector } from './components/ComparacaoWeekSelector';
import { ComparacaoSectionSelector } from './components/ComparacaoSectionSelector';
import { SecoesVisiveis } from './hooks/useComparacaoFilters';
import { SaasPanel } from '@/components/views/shared/SaasPrimitives';

interface ComparacaoFiltersProps {
    pracas: FilterOption[];
    todasSemanas: (number | string)[];
    semanasSelecionadas: string[];
    pracaSelecionada: string | null;
    shouldDisablePracaFilter: boolean;
    onPracaChange: (praca: string | null) => void;
    onToggleSemana: (semana: number | string) => void;
    onClearSemanas: () => void;
    onMostrarApresentacao: () => void;
    loading: boolean;
    error: string | null;
    dadosComparacao: any[];
    utrComparacao: any[];
    secoesVisiveis: SecoesVisiveis;
    onToggleSecao: (secao: keyof SecoesVisiveis) => void;
    loadingSemanas: boolean;
    errorSemanas: string | null;
    onRetrySemanas: () => void;
}

export const ComparacaoFilters = React.memo(function ComparacaoFilters({
    pracas,
    todasSemanas,
    semanasSelecionadas,
    pracaSelecionada,
    shouldDisablePracaFilter,
    onPracaChange,
    onToggleSemana,
    onClearSemanas,
    onMostrarApresentacao,
    loading,
    error,
    dadosComparacao,
    secoesVisiveis,
    onToggleSecao,
    loadingSemanas,
    errorSemanas,
    onRetrySemanas,
}: ComparacaoFiltersProps) {
    const hasEnoughData = !loading
        && !error
        && semanasSelecionadas.length === 2
        && dadosComparacao.length === 2;

    return (
        <SaasPanel className="overflow-visible rounded-xl border-[#d8e4eb] shadow-[0_8px_28px_-24px_rgba(15,57,82,0.5)] dark:border-slate-800">
            <header className="flex min-w-0 flex-col gap-4 rounded-t-xl bg-[#174d70] px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.025em] text-white sm:text-[24px]">
                        Comparativo semanal
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-sky-100/90 sm:text-[13px]">
                        Compare o desempenho operacional entre duas semanas.
                    </p>
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
                    <ComparacaoSectionSelector secoesVisiveis={secoesVisiveis} onToggleSecao={onToggleSecao} />

                    {semanasSelecionadas.length > 0 ? (
                        <button
                            onClick={onClearSemanas}
                            type="button"
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 text-xs font-semibold text-white transition-colors duration-150 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#174d70]"
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpar
                        </button>
                    ) : null}

                    <button
                        onClick={onMostrarApresentacao}
                        disabled={!hasEnoughData}
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-[#174d70] transition-colors duration-150 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#174d70] sm:px-3.5"
                        title={loading
                            ? 'Aguarde a atualização dos dados'
                            : error
                                ? 'Corrija a atualização antes de gerar a apresentação'
                                : !hasEnoughData
                                    ? 'Selecione exatamente 2 semanas com dados carregados'
                                    : 'Gerar apresentação'}
                    >
                        <Presentation className="h-4 w-4" />
                        Apresentação
                    </button>
                </div>
            </header>

            <div className="p-4 sm:p-5">
                <div className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)] xl:items-end">
                    <div className="min-w-0">
                        <FiltroSelect
                            label="Praça"
                            value={pracaSelecionada ?? ''}
                            options={pracas}
                            placeholder="Todas as praças"
                            onChange={(value) => onPracaChange(value)}
                            disabled={shouldDisablePracaFilter}
                            appearance="quiet"
                        />
                    </div>

                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <label className="text-xs font-semibold text-[#183f58] dark:text-slate-200">
                                Semanas da comparação
                            </label>
                            {semanasSelecionadas.length > 0 ? (
                                <span className="text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                                    {semanasSelecionadas.length} de 2 selecionadas
                                </span>
                            ) : null}
                        </div>

                        <ComparacaoWeekSelector
                            todasSemanas={todasSemanas}
                            semanasSelecionadas={semanasSelecionadas}
                            onToggleSemana={onToggleSemana}
                            loading={loadingSemanas}
                            error={errorSemanas}
                            onRetry={onRetrySemanas}
                        />
                    </div>
                </div>
            </div>
        </SaasPanel>
    );
});

ComparacaoFilters.displayName = 'ComparacaoFilters';
