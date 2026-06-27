import React from 'react';
import { FilterOption } from '@/types';
import FiltroSelect from '@/components/shared/filters/FiltroSelect';
import { BarChart3, Presentation, X } from 'lucide-react';
import { ComparacaoWeekSelector } from './components/ComparacaoWeekSelector';
import { ComparacaoSectionSelector } from './components/ComparacaoSectionSelector';
import { SecoesVisiveis } from './hooks/useComparacaoFilters';
import { SaasPanel, SaasPanelHeader } from '@/components/views/shared/SaasPrimitives';

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
        <SaasPanel className="overflow-visible">
            <SaasPanelHeader
                eyebrow="Comparativo"
                title="Comparativo semanal"
                description="Análise bi-semanal de performance, crescimento e variação operacional."
                icon={BarChart3}
                actions={(
                    <div className="flex flex-wrap items-center gap-2.5">
                        <ComparacaoSectionSelector secoesVisiveis={secoesVisiveis} onToggleSecao={onToggleSecao} />

                        {semanasSelecionadas.length > 0 ? (
                            <button
                                onClick={onClearSemanas}
                                type="button"
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
                            >
                                <X className="h-3.5 w-3.5" />
                                Limpar
                            </button>
                        ) : null}

                        <button
                            onClick={onMostrarApresentacao}
                            disabled={semanasSelecionadas.length !== 2 || dadosComparacaoLength !== 2}
                            type="button"
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-sm transition-[background-color,box-shadow,transform,opacity] duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                            title={semanasSelecionadas.length !== 2 ? 'Selecione exatamente 2 semanas' : 'Gerar apresentação'}
                        >
                            <Presentation className="h-4 w-4" />
                            Apresentação
                        </button>
                    </div>
                )}
            />

            <div className="p-4 sm:p-5">
                <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="min-w-0">
                        <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            Praça selecionada
                        </label>
                        <FiltroSelect
                            label=""
                            value={pracaSelecionada ?? ''}
                            options={pracas}
                            placeholder="Todas as praças"
                            onChange={(value) => onPracaChange(value)}
                            disabled={shouldDisablePracaFilter}
                        />
                    </div>

                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                Janelas de tempo
                            </label>
                            {semanasSelecionadas.length > 0 ? (
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500 dark:text-blue-300">
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
        </SaasPanel>
    );
};
