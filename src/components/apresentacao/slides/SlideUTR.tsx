import React from 'react';
import SlideWrapper from '../SlideWrapper';
import { SlideHeader } from './components/SlideHeader';
import { cn } from '@/lib/utils';
import { Target, AlertTriangle } from 'lucide-react';
import { UtrData } from '@/types';
import { extractUtrValue } from '@/utils/utr/extractUtrValue';

interface UtrComparacaoItem { semana: string; utr: UtrData | null; }

interface SlideUTRProps { isVisible: boolean; numeroSemana1: string; numeroSemana2: string; utrComparacao: UtrComparacaoItem[]; }

const SlideUTR: React.FC<SlideUTRProps> = ({ isVisible, numeroSemana1, numeroSemana2, utrComparacao }) => {
    const renderContent = () => {
        if (!utrComparacao || utrComparacao.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center flex-1 h-full text-center p-8">
                    <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
                    <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">UTR não disponível</h3>
                    <p className="text-lg text-slate-500 dark:text-slate-400">Os dados de UTR não foram carregados para as semanas selecionadas.</p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col justify-center items-center w-full max-w-4xl mx-auto">
                <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-8 py-6 text-left text-lg font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Métrica</th>
                                {utrComparacao.map((item) => (
                                    <th key={item.semana} className="px-8 py-6 text-center text-lg font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700">
                                        Semana {item.semana}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-8 py-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-950/40 rounded-lg">
                                            <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">UTR Geral</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Utilização de Tempo Real</p>
                                        </div>
                                    </div>
                                </td>
                                {utrComparacao.map((item, idx) => {
                                    const utrValue = extractUtrValue(item.utr);
                                    const hasError = utrValue === null;

                                    return (
                                        <td key={idx} className="px-8 py-10 text-center border-l border-slate-200 dark:border-slate-700 align-middle">
                                            {hasError ? (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/40 px-6 py-2 text-base font-bold text-amber-800 dark:text-amber-400">
                                                    N/D
                                                </span>
                                            ) : (
                                                <span className="text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                                    {utrValue.toFixed(2)}%
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <SlideWrapper isVisible={isVisible} style={{ padding: '32px 48px' }}>
            <SlideHeader
                title="UTR"
                subTitle={`Comparativo Semanas ${numeroSemana1} vs ${numeroSemana2}`}
            />
            {renderContent()}
        </SlideWrapper>
    );
};

export default SlideUTR;
