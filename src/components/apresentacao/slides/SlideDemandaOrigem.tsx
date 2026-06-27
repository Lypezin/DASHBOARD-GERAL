import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { MetricCard } from './components/MetricCard';
import { VariationCard } from './components/VariationCard';
import { DemandaOrigemItem } from '@/utils/apresentacao/processors/demandaOrigem';

interface SlideDemandaOrigemProps {
    isVisible: boolean;
    numeroSemana1: string;
    numeroSemana2: string;
    paginaAtual: number;
    totalPaginas: number;
    itens: DemandaOrigemItem[];
}

const SlideDemandaOrigem: React.FC<SlideDemandaOrigemProps> = ({
    isVisible,
    numeroSemana1,
    numeroSemana2,
    paginaAtual,
    totalPaginas,
    itens,
}) => {
    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
            <SlideHeader
                title="DEMANDA POR ORIGEM"
                subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
            />

            {totalPaginas > 1 && (
                <p className="text-center text-base font-medium text-slate-400 -mt-4 mb-3">
                    Página {paginaAtual} de {totalPaginas}
                </p>
            )}

            <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl mx-auto">
                {itens.map((origem) => (
                    <div key={origem.nome} className="flex flex-col gap-5 w-full">
                        {/* Origem label */}
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                                {origem.nome}
                            </span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                        </div>

                        {/* Col headers */}
                        <div className="grid grid-cols-3 gap-6">
                            <h3 className="text-base font-bold text-center px-4 py-2 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-sky-800 dark:text-sky-300 border border-sky-100 dark:border-sky-900/60 uppercase tracking-wide">
                                SEMANA {numeroSemana1}
                            </h3>
                            <h3 className="text-base font-bold text-center px-4 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 uppercase tracking-wide">
                                VARIAÇÕES
                            </h3>
                            <h3 className="text-base font-bold text-center px-4 py-2 bg-blue-600 dark:bg-blue-700 rounded-xl text-white shadow-md uppercase tracking-wide border border-blue-700 dark:border-blue-800">
                                SEMANA {numeroSemana2}
                            </h3>
                        </div>

                        {/* Metric rows */}
                        <div className="flex flex-col gap-3">
                            {origem.metricas.map((metrica) => (
                                <div key={metrica.label} className="grid grid-cols-3 gap-6">
                                    <MetricCard
                                        label={metrica.label}
                                        value={metrica.semana1Valor}
                                        variant="week1"
                                    />
                                    <VariationCard
                                        label={metrica.label}
                                        value={metrica.variacaoValor}
                                        positive={metrica.variacaoPositiva}
                                        percentual={metrica.variacaoPercentual}
                                        percentualPositiva={metrica.variacaoPercentualPositiva}
                                    />
                                    <MetricCard
                                        label={metrica.label}
                                        value={metrica.semana2Valor}
                                        variant="week2"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </SlideWrapper>
    );
};

export default SlideDemandaOrigem;
