
import React from 'react';
import { WeekComparisonCircle } from './WeekComparisonCircle';
import { SubPracaComparativo } from '../SlideSubPracas';
import { SubPracaModalMetrics } from './SubPracaModalMetrics';

interface SubPracaModalProps {
    selectedItem: SubPracaComparativo;
    numeroSemana1: string;
    numeroSemana2: string;
    onClose: () => void;
}

export const SubPracaModal: React.FC<SubPracaModalProps> = ({
    selectedItem,
    numeroSemana1,
    numeroSemana2,
    onClose
}) => {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes de ${selectedItem.nome}`}
            className="fixed inset-0 z-[100010] bg-black/80 flex items-center justify-center p-4 sm:p-8 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in border border-transparent dark:border-slate-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5 sm:px-8 sm:py-6 relative">
                    <button
                        type="button"
                        aria-label="Fechar detalhes"
                        onClick={onClose}
                        className="absolute top-5 right-5 sm:top-6 sm:right-6 text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="pr-12 text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-1.5 sm:mb-2 break-words">{selectedItem.nome}</h2>
                    <p className="text-blue-100 text-base sm:text-lg">Detalhamento de Performance</p>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-10">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 mb-8 sm:mb-10">
                        <div className="text-center sm:scale-110">
                            <WeekComparisonCircle
                                aderencia={selectedItem.semana1.aderencia}
                                horasEntregues={selectedItem.semana1.horasEntregues}
                                horasPlanejadas={selectedItem.semana1.horasPlanejadas}
                                label={`SEMANA ${numeroSemana1}`}
                                isSecond={false}
                                size="large"
                            />
                        </div>
                        <div className="h-px w-24 sm:h-32 sm:w-px bg-slate-200 dark:bg-slate-800"></div>
                        <div className="text-center sm:scale-110">
                            <WeekComparisonCircle
                                aderencia={selectedItem.semana2.aderencia}
                                horasEntregues={selectedItem.semana2.horasEntregues}
                                horasPlanejadas={selectedItem.semana2.horasPlanejadas}
                                label={`SEMANA ${numeroSemana2}`}
                                isSecond={true}
                                size="large"
                            />
                        </div>
                    </div>

                    {/* Detailed Metrics Grid */}
                    <SubPracaModalMetrics selectedItem={selectedItem} />
                </div>

                {/* Footer Insight from AI Logic (Mocked for now or reused) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
                        Use a ferramenta de <strong className="dark:text-slate-300">Caneta</strong> para fazer anotações sobre este resultado.
                    </p>
                </div>
            </div>
        </div>
    );
};
