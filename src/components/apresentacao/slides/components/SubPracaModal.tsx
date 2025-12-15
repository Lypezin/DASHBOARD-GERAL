
import React from 'react';
import { WeekComparisonCircle } from './WeekComparisonCircle';
import { SubPracaComparativo } from '../SlideSubPracas';

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
        <div className="fixed inset-0 z-[100010] bg-black/80 flex items-center justify-center p-8 animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-2">{selectedItem.nome}</h2>
                    <p className="text-blue-100 text-lg">Detalhamento de Performance</p>
                </div>

                {/* Content */}
                <div className="p-10">
                    <div className="flex justify-center items-center gap-16 mb-10">
                        <div className="text-center transform scale-125">
                            <WeekComparisonCircle
                                aderencia={selectedItem.semana1.aderencia}
                                horasEntregues={selectedItem.semana1.horasEntregues}
                                label={`SEMANA ${numeroSemana1}`}
                                isSecond={false}
                                size="large"
                            />
                        </div>
                        <div className="w-px h-32 bg-slate-200"></div>
                        <div className="text-center transform scale-125">
                            <WeekComparisonCircle
                                aderencia={selectedItem.semana2.aderencia}
                                horasEntregues={selectedItem.semana2.horasEntregues}
                                label={`SEMANA ${numeroSemana2}`}
                                isSecond={true}
                                size="large"
                            />
                        </div>
                    </div>

                    {/* Detailed Metrics Grid */}
                    <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Planejado vs Realizado</h4>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Total Planejado</p>
                                    <p className="text-xl font-bold text-slate-700">{selectedItem.horasPlanejadas}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Última Semana</p>
                                    <p className="text-xl font-bold text-blue-600">{selectedItem.semana2.horasEntregues}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Variação de Performance</h4>
                            <div className="flex gap-4">
                                {selectedItem.variacoes.map(v => (
                                    <div key={v.label} className={`flex-1 rounded-lg p-2 text-center border ${v.positivo ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-rose-100 border-rose-200 text-rose-700'}`}>
                                        <p className="text-[0.6rem] font-bold uppercase opacity-70 mb-1">{v.label}</p>
                                        <p className="text-lg font-black leading-none">{v.valor}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Insight from AI Logic (Mocked for now or reused) */}
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
                    <p className="text-center text-slate-500 text-sm">
                        Use a ferramenta de <strong>Caneta</strong> para fazer anotações sobre este resultado.
                    </p>
                </div>
            </div>
        </div>
    );
};
