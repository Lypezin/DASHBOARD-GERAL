import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/FiltroSelect';
import { Presentation, X } from 'lucide-react';
import { ComparacaoWeekSelector } from './components/ComparacaoWeekSelector';
import { ComparacaoSectionSelector } from './components/ComparacaoSectionSelector';
import { SecoesVisiveis } from './hooks/useComparacaoFilters';

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
    dadosComparacaoLength: number;
    secoesVisiveis: SecoesVisiveis;
    onToggleSecao: (secao: keyof SecoesVisiveis) => void;
}

export const ComparacaoFilters: React.FC<ComparacaoFiltersProps> = ({
    pracas,
    todasSemanas,
    semanasSelecionadas,
    pracaSelecionada,
    shouldDisablePracaFilter,
    onPracaChange,
    onToggleSemana,
    onClearSemanas,
    onMostrarApresentacao,
    dadosComparacaoLength,
    secoesVisiveis,
    onToggleSecao
}) => {
    return (
        <div className="mb-10 space-y-5 animate-fade-in">
            <div className="flex flex-col gap-4 px-1 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Comparativo <span className="text-sky-600 dark:text-sky-300">semanal</span>
                    </h1>
                    <p className="mt-1 text-[13px] font-medium text-slate-400 dark:text-slate-500">
                        Analise bi-semanal de performance e crescimento
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <ComparacaoSectionSelector secoesVisiveis={secoesVisiveis} onToggleSecao={onToggleSecao} />

                    {semanasSelecionadas.length > 0 ? (
                        <button
                            onClick={onClearSemanas}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/82 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.45)] transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800/80 dark:bg-slate-900/82 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpar
                        </button>
                    ) : null}

                    <button
                        onClick={onMostrarApresentacao}
                        disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_30px_-22px_rgba(15,23,42,0.7)] transition-[background-color,box-shadow,transform,opacity] duration-200 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-25 disabled:grayscale"
                        title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas' : 'Gerar apresentacao'}
                    >
                        <Presentation className="h-4 w-4" />
                        Apresentacao
                    </button>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white/88 p-5 shadow-[0_22px_60px_-46px_rgba(15,23,42,0.58)] dark:border-slate-800/70 dark:bg-slate-900/84 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                    <div className="w-full xl:w-60 xl:flex-shrink-0">
                        <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            Praca selecionada
                        </label>
                        <FiltroSelect
                            label=""
                            value={pracaSelecionada ?? ''}
                            options={pracas}
                            placeholder="Todas as pracas"
                            onChange={(value) => onPracaChange(value)}
                            disabled={shouldDisablePracaFilter}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                Janelas de tempo
                            </label>
                            {semanasSelecionadas.length > 0 ? (
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-500 dark:text-sky-300">
                                    {semanasSelecionadas.length} / 2 ativas
                                </span>
                            ) : null}
                        </div>

                        <ComparacaoWeekSelector
                            todasSemanas={todasSemanas}
                            semanasSelecionadas={semanasSelecionadas}
                            onToggleSemana={onToggleSemana}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
